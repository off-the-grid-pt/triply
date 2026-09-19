#!/usr/bin/env node
// run-batch.ts — create a harness run from a batch file and prepare agent prompt.
//
// Usage:
//   npm run agent:run-batch -- --module 02-trips --stage design
//   npm run agent:run-batch -- --batch harness/batches/01-auth-onboarding-frontend.md

import { join, resolve } from "node:path";
import { Command } from "commander";
import { markCompleted, markStatus, setScoreResult, setValidationResult } from "../lib/metrics";
import { fileExists, readText, writeText } from "../lib/file-utils";
import { defaultBatchPath, isModuleId, isStage, loadBatchFile } from "../lib/batch-loader";
import { runCodexAgent } from "../lib/agents/codex";
import { runValidation } from "../lib/validation-runner";
import { buildRepairPrompt, writePromptFile } from "../lib/prompt-builder";
import { runCommand } from "../lib/process-runner";
import { scoreRun, summarizeRunScore } from "../lib/run-scoring";
import { checkChangedFilesScope, formatScopeCheckResult } from "../lib/scope-checker";
import {
  appendEvent,
  createRunDir,
  readRunMetrics,
  writeDiff,
  writeRunMetrics,
  writeScore,
  writeValidationLog,
} from "../lib/run-state";
import type { ModuleId, Stage } from "../lib/types";
import type { AgentMode } from "../lib/agent-runner";

const DEFAULT_FORBIDDEN_FILES = [
  "spec/*.md",
  "CLAUDE.md",
  "AGENTS.md",
  "project-state.json",
  "harness/**",
  ".env.local",
];

const DEFAULT_IGNORED_CHANGED_FILES = [
  "test-results/**",
];

interface CliOptions {
  batch?: string;
  module?: string;
  stage?: string;
  mode: AgentMode;
  validate: boolean;
  score: boolean;
  enforceScope: boolean;
  allowDirty: boolean;
  skipTest: boolean;
  skipE2e: boolean;
  agentTimeoutMs: string;
  repairAttempts: string;
  codexModel?: string;
}

function parseOptions(): CliOptions {
  const program = new Command();
  program
    .name("run-batch")
    .description("Prepare a Triply harness run from a module batch")
    .option("--batch <path>", "batch markdown file")
    .option("--module <module>", "module id, e.g. 02-trips")
    .option("--stage <stage>", "stage, e.g. design")
    .option("--mode <mode>", "agent mode: manual, claude, codex", "manual")
    .option("--validate", "run validation after creating the prompt", false)
    .option("--score", "score the run after validation/scope checks", false)
    .option("--no-enforce-scope", "disable changed-file allow/deny enforcement")
    .option("--allow-dirty", "allow starting from an already dirty worktree", false)
    .option("--skip-test", "skip npm run test when --validate is used", false)
    .option("--skip-e2e", "skip npm run test:e2e when --validate is used", false)
    .option("--agent-timeout-ms <ms>", "timeout for live agent execution", "1200000")
    .option("--repair-attempts <count>", "Codex repair attempts after failed score", "0")
    .option("--codex-model <model>", "optional Codex model override")
    .parse(process.argv);

  const opts = program.opts<CliOptions>();
  if (!["manual", "claude", "codex"].includes(opts.mode)) {
    program.error("--mode must be one of: manual, claude, codex");
  }
  return opts;
}

function parsePositiveInteger(value: string, label: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(label + " must be a non-negative integer.");
  }
  return parsed;
}

function resolveBatchFile(repoRoot: string, opts: CliOptions): string {
  if (opts.batch) return resolve(repoRoot, opts.batch);

  if (!opts.module || !opts.stage) {
    throw new Error("Either --batch or both --module and --stage are required.");
  }
  if (!isModuleId(opts.module)) {
    throw new Error("Invalid module: " + opts.module);
  }
  if (!isStage(opts.stage)) {
    throw new Error("Invalid stage: " + opts.stage);
  }

  return defaultBatchPath(repoRoot, opts.module as ModuleId, opts.stage as Stage);
}

function agentNameForMode(mode: AgentMode, batchAgent: string): string {
  if (mode === "claude") return batchAgent + " via Claude";
  if (mode === "codex") return batchAgent + " via Codex";
  return batchAgent + " via Manual";
}

function printNextSteps(runDir: string, mode: AgentMode): void {
  process.stdout.write("\nNext steps:\n");
  if (mode === "manual") {
    process.stdout.write("  1. Open " + runDir + "/prompt.md\n");
    process.stdout.write("  2. Send that prompt to the selected agent\n");
    process.stdout.write("  3. Paste the agent output into " + runDir + "/result.md\n");
  } else if (mode === "codex") {
    process.stdout.write("  1. Review " + runDir + "/result.md\n");
    process.stdout.write("  2. Inspect the git diff before approving the stage\n");
  } else {
    process.stdout.write("  1. Agent mode '" + mode + "' is not implemented yet\n");
    process.stdout.write("  2. Use " + runDir + "/prompt.md as the handoff prompt\n");
    process.stdout.write("  3. Paste the agent output into " + runDir + "/result.md\n");
  }
  process.stdout.write("  4. Run validation or rerun this command with --validate\n");
  process.stdout.write("  5. Run: npm run harness:score -- " + runDir + "\n");
  process.stdout.write("  6. Run: npm run harness:end -- " + runDir + "\n");
}

function parseGitStatusFiles(output: string): string[] {
  return output
    .split(/\r?\n/)
    .map(line => line.trimEnd())
    .filter(Boolean)
    .map(line => {
      const file = line.slice(3).trim();
      const renameTarget = file.split(" -> ").at(-1);
      return renameTarget ?? file;
    })
    .filter(Boolean)
    .sort();
}

async function gitOutput(repoRoot: string, args: string[]): Promise<string> {
  const result = await runCommand({ command: "git", args, cwd: repoRoot });
  if (result.exitCode !== 0) {
    throw new Error(result.stderr || result.error || "git " + args.join(" ") + " failed");
  }
  return result.stdout.trimEnd();
}

async function gitStatusFiles(repoRoot: string): Promise<string[]> {
  return parseGitStatusFiles(await gitOutput(repoRoot, ["status", "--porcelain", "--untracked-files=all"]));
}

function filesChangedSince(before: string[], after: string[]): string[] {
  const beforeSet = new Set(before);
  return after.filter(file => !beforeSet.has(file));
}

function fileOrEmpty(path: string): string {
  return fileExists(path) ? readText(path) : "";
}

async function captureDiff(repoRoot: string, runDir: string, changedFiles: string[]): Promise<void> {
  const diff = changedFiles.length > 0
    ? await gitOutput(repoRoot, ["diff", "--", ...changedFiles])
    : "";
  const diffContent = [
    "# Diff",
    "",
    diff || "(no tracked diff)",
    "",
    "## changed files",
    changedFiles.length > 0 ? changedFiles.join("\n") : "(no files changed)",
  ].join("\n");
  writeDiff(runDir, diffContent);
}

async function runScopeValidation(repoRoot: string, runDir: string, baselineFiles: string[], batch: ReturnType<typeof loadBatchFile>, enforceScope: boolean): Promise<boolean> {
  const changedFiles = filesChangedSince(baselineFiles, await gitStatusFiles(repoRoot));
  await captureDiff(repoRoot, runDir, changedFiles);

  const scope = checkChangedFilesScope({
    changedFiles,
    allowedFiles: batch.allowedFiles,
    forbiddenFiles: [...DEFAULT_FORBIDDEN_FILES, ...batch.forbiddenFiles],
    ignoredFiles: DEFAULT_IGNORED_CHANGED_FILES,
  });
  const scopeReport = formatScopeCheckResult(scope);
  writeText(join(runDir, "scope.log"), scopeReport);

  const metrics = markCompleted(readRunMetrics(runDir), { filesChanged: changedFiles });
  writeRunMetrics(runDir, metrics);

  if (enforceScope) {
    process.stdout.write("\n" + scopeReport);
  }
  return enforceScope ? scope.ok : true;
}

async function runCodexAttempt({
  repoRoot,
  runDir,
  prompt,
  resultPath,
  timeoutMs,
  model,
  batch,
  agent,
  mode,
  attempt,
}: {
  repoRoot: string;
  runDir: string;
  prompt: string;
  resultPath: string;
  timeoutMs: number;
  model?: string;
  batch: ReturnType<typeof loadBatchFile>;
  agent: string;
  mode: AgentMode;
  attempt: number;
}): Promise<void> {
  process.stdout.write("\nRunning Codex agent" + (attempt > 0 ? " repair attempt " + attempt : "") + "...\n");
  const agentResult = await runCodexAgent(
    {
      repoRoot,
      runDir,
      prompt,
      resultPath,
      timeoutMs,
    },
    {
      model,
    }
  );

  writeText(join(runDir, attempt > 0 ? "agent-repair-" + attempt + ".log" : "agent.log"), agentResult.output);
  const metrics = markStatus(readRunMetrics(runDir), agentResult.ok ? "agent_done" : "rejected");
  writeRunMetrics(runDir, metrics);

  appendEvent(repoRoot, {
    event: attempt > 0 ? "run.agent_repair" : "run.agent",
    module: batch.module,
    stage: batch.stage,
    agent,
    runDir,
    mode,
    attempt,
    ok: agentResult.ok,
    exitCode: agentResult.exitCode,
    timedOut: agentResult.timedOut,
    resultPath,
  });

  process.stdout.write("Codex agent: " + (agentResult.ok ? "PASS" : "FAIL") + "\n");
  process.stdout.write("  Result: " + resultPath + "\n");
  if (!agentResult.ok) {
    throw new Error(agentResult.error ?? "Codex agent failed.");
  }
}

async function validateAndScore({
  repoRoot,
  runDir,
  batch,
  baselineFiles,
  enforceScope,
  validate,
  score,
  skipTest,
  skipE2e,
  agent,
}: {
  repoRoot: string;
  runDir: string;
  batch: ReturnType<typeof loadBatchFile>;
  baselineFiles: string[];
  enforceScope: boolean;
  validate: boolean;
  score: boolean;
  skipTest: boolean;
  skipE2e: boolean;
  agent: string;
}): Promise<"APPROVED" | "NEEDS_CHANGES" | "REJECTED" | "IN_PROGRESS"> {
  const scopeOk = await runScopeValidation(repoRoot, runDir, baselineFiles, batch, enforceScope);

  if (validate) {
    const validation = await runValidation({
      cwd: repoRoot,
      skipTest,
      skipE2e,
    });
    writeValidationLog(runDir, validation.log);
    const metrics = setValidationResult(readRunMetrics(runDir), {
      tsc: validation.steps.find(s => s.key === "tsc")?.status ?? null,
      build: validation.steps.find(s => s.key === "build")?.status ?? null,
      test: validation.steps.find(s => s.key === "test")?.status ?? null,
      test_e2e: validation.steps.find(s => s.key === "test_e2e")?.status ?? null,
    });
    writeRunMetrics(runDir, metrics);

    appendEvent(repoRoot, {
      event: "run.validation",
      module: batch.module,
      stage: batch.stage,
      agent,
      runDir,
      ok: validation.ok,
      failed: validation.failed,
    });

    process.stdout.write("\nValidation: " + (validation.ok ? "PASS" : "FAIL") + "\n");
    if (!validation.ok) {
      process.stdout.write("Failed steps: " + validation.failed.join(", ") + "\n");
    }
  }

  if (!score) return "IN_PROGRESS";

  const metrics = readRunMetrics(runDir);
  const result = scoreRun({
    validation: metrics.validation,
    flags: {
      scopeViolation: !scopeOk,
    },
  });
  setScoreResult(metrics, { score: result.score, verdict: result.verdict });
  writeRunMetrics(runDir, metrics);

  const summary = [
    summarizeRunScore(result, metrics.validation),
    "",
    readText(join(runDir, "scope.log")).trim(),
    "",
  ].join("\n");
  writeScore(runDir, summary);

  appendEvent(repoRoot, {
    event: "run.score",
    module: batch.module,
    stage: batch.stage,
    agent,
    runDir,
    score: result.score,
    verdict: result.verdict,
  });

  process.stdout.write("\n" + summary);
  return result.verdict;
}

async function main(): Promise<void> {
  const opts = parseOptions();
  const repoRoot = process.cwd();
  const repairAttempts = parsePositiveInteger(opts.repairAttempts, "--repair-attempts");
  const timeoutMs = parsePositiveInteger(opts.agentTimeoutMs, "--agent-timeout-ms");
  if (timeoutMs <= 0) throw new Error("--agent-timeout-ms must be a positive integer.");
  if (repairAttempts > 0 && opts.mode !== "codex") {
    throw new Error("--repair-attempts requires --mode codex.");
  }

  const initialStatusFiles = await gitStatusFiles(repoRoot);
  const needsCleanWorktree = opts.mode === "codex" || opts.validate || opts.score;
  if (initialStatusFiles.length > 0 && needsCleanWorktree && !opts.allowDirty) {
    throw new Error(
      "Worktree is dirty. Commit/stash changes or rerun with --allow-dirty.\n" +
      initialStatusFiles.map(file => "  " + file).join("\n")
    );
  }

  const batchFile = resolveBatchFile(repoRoot, opts);
  const batch = loadBatchFile(batchFile);
  const agent = agentNameForMode(opts.mode, batch.agent);
  const branch = "feat/" + batch.module;

  const { runDir, metrics } = createRunDir({
    repoRoot,
    module: batch.module,
    stage: batch.stage,
    agent,
    branch,
  });

  const promptBatch = { ...batch, agent, batchFile };
  writePromptFile({ repoRoot, batch: promptBatch, runDir });
  markStatus(metrics, "prompt_ready");
  writeRunMetrics(runDir, metrics);

  appendEvent(repoRoot, {
    event: "run.prompt_ready",
    module: batch.module,
    stage: batch.stage,
    agent,
    branch,
    runDir,
    batchFile,
    mode: opts.mode,
  });

  process.stdout.write("Run prepared:\n");
  process.stdout.write("  Module:  " + batch.module + "\n");
  process.stdout.write("  Stage:   " + batch.stage + "\n");
  process.stdout.write("  Agent:   " + agent + "\n");
  process.stdout.write("  Batch:   " + batchFile + "\n");
  process.stdout.write("  Run dir: " + runDir + "\n");
  process.stdout.write("  Prompt:  " + runDir + "/prompt.md\n");

  const baselineFiles = await gitStatusFiles(repoRoot);

  if (opts.mode === "claude") {
    throw new Error("Claude adapter is not implemented yet. Use --mode manual or --mode codex.");
  }

  if (opts.mode === "codex") {
    const promptPath = join(runDir, "prompt.md");
    const resultPath = join(runDir, "result.md");
    const prompt = readText(promptPath);

    await runCodexAttempt({
      repoRoot,
      runDir,
      prompt,
      resultPath,
      timeoutMs,
      model: opts.codexModel,
      batch,
      agent,
      mode: opts.mode,
      attempt: 0,
    });

    let verdict = await validateAndScore({
      repoRoot,
      runDir,
      batch,
      baselineFiles,
      enforceScope: opts.enforceScope,
      validate: opts.validate,
      score: opts.score,
      skipTest: opts.skipTest,
      skipE2e: opts.skipE2e,
      agent,
    });

    for (let attempt = 1; attempt <= repairAttempts && verdict !== "APPROVED"; attempt += 1) {
      const repairPrompt = buildRepairPrompt({
        batch,
        validationOutput: [
          fileOrEmpty(join(runDir, "validation.log")),
          fileOrEmpty(join(runDir, "scope.log")),
        ].filter(Boolean).join("\n\n"),
        score: readRunMetrics(runDir).score,
        verdict,
        attempt,
      });
      await runCodexAttempt({
        repoRoot,
        runDir,
        prompt: repairPrompt,
        resultPath,
        timeoutMs,
        model: opts.codexModel,
        batch,
        agent,
        mode: opts.mode,
        attempt,
      });
      verdict = await validateAndScore({
        repoRoot,
        runDir,
        batch,
        baselineFiles,
        enforceScope: opts.enforceScope,
        validate: opts.validate,
        score: opts.score,
        skipTest: opts.skipTest,
        skipE2e: opts.skipE2e,
        agent,
      });
    }
  } else if (opts.validate || opts.score) {
    await validateAndScore({
      repoRoot,
      runDir,
      batch,
      baselineFiles,
      enforceScope: opts.enforceScope,
      validate: opts.validate,
      score: opts.score,
      skipTest: opts.skipTest,
      skipE2e: opts.skipE2e,
      agent,
    });
  }

  printNextSteps(runDir, opts.mode);
}

main().catch((err: Error) => {
  process.stderr.write("run-batch failed: " + err.message + "\n");
  process.exit(1);
});
