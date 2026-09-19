#!/usr/bin/env node
// end-run.ts — capture diff, mark run completed, log the event.
//
// Usage:
//   npm run harness:end -- <run-dir>
//   node --import tsx harness/scripts/end-run.ts <run-dir>

import { resolve } from "node:path";
import { markCompleted } from "../lib/metrics";
import { runCommand } from "../lib/process-runner";
import { appendEvent, readRunMetrics, writeDiff, writeRunMetrics } from "../lib/run-state";

function usage(msg?: string): never {
  if (msg) process.stderr.write("error: " + msg + "\n");
  process.stderr.write("usage: node --import tsx harness/scripts/end-run.ts <run-dir>\n");
  process.exit(2);
}

async function git(repoRoot: string, args: string[]): Promise<string> {
  const result = await runCommand({ command: "git", args, cwd: repoRoot });
  if (result.exitCode !== 0) {
    throw new Error(result.stderr || result.error || "git " + args.join(" ") + " failed");
  }
  return result.stdout;
}

async function main(): Promise<void> {
  const runDirArg = process.argv[2];
  if (!runDirArg) usage("missing run directory");

  const repoRoot = process.cwd();
  const runDir = resolve(repoRoot, runDirArg);

  const status = await git(repoRoot, ["status", "--short"]);
  const stat = await git(repoRoot, ["diff", "--stat"]);
  const nameOnly = await git(repoRoot, ["diff", "--name-only"]);

  const diffContent = [
    "## git status --short",
    status || "(clean)",
    "",
    "## git diff --stat",
    stat || "(no changes)",
    "",
    "## git diff --name-only",
    nameOnly || "(no files changed)",
  ].join("\n");

  writeDiff(runDir, diffContent);

  const filesChanged = nameOnly
    .split(/\r?\n/)
    .map((s: string) => s.trim())
    .filter(Boolean);

  const metrics = readRunMetrics(runDir);
  markCompleted(metrics, { filesChanged });
  writeRunMetrics(runDir, metrics);

  appendEvent(repoRoot, {
    event: "run.end",
    module: metrics.module,
    stage: metrics.stage,
    agent: metrics.agent,
    runDir,
    filesChanged: filesChanged.length,
    durationSeconds: metrics.durationSeconds,
  });

  process.stdout.write("ended: " + runDir + "\n");
  process.stdout.write("files changed: " + filesChanged.length + "\n");
  if (filesChanged.length > 0) {
    process.stdout.write(filesChanged.map((f: string) => "  " + f).join("\n") + "\n");
  }
}

main().catch((err: Error) => {
  process.stderr.write("end-run failed: " + err.message + "\n");
  process.exit(1);
});
