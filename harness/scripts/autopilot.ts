#!/usr/bin/env node
// autopilot.ts — advance Triply module stages through Codex while routine gates pass.
// It never approves specs, pushes, merges or deploys.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { runCommand } from "../lib/process-runner";
import { listRunDirs, readRunMetrics, appendEvent } from "../lib/run-state";
import type { ProjectState, Stage } from "../lib/types";

const STAGES: Stage[] = ["architecture", "design", "database", "backend", "frontend", "qa"];

function readState(root: string): ProjectState {
  return JSON.parse(readFileSync(join(root, "project-state.json"), "utf8")) as ProjectState;
}

function writeState(root: string, state: ProjectState): void {
  const mutable = state as ProjectState & { last_updated?: string };
  mutable.last_updated = new Date().toISOString();
  writeFileSync(join(root, "project-state.json"), JSON.stringify(state, null, 2) + "\n");
}

function specApproved(root: string, specPath: string): boolean {
  const text = readFileSync(join(root, specPath), "utf8");
  return /^Status:\s*APPROVED\s*$/mi.test(text);
}

function moduleDone(state: ProjectState, id: string): boolean {
  const m = state.modules[id];
  return m?.status === "complete" || m?.status === "done";
}

async function main(): Promise<void> {
  const root = process.cwd();
  const state = readState(root);
  const moduleId = (state as ProjectState & { current_module?: string }).current_module;
  if (!moduleId || !state.modules[moduleId]) throw new Error("No valid current_module in project-state.json");
  const module = state.modules[moduleId] as typeof state.modules[string] & { dependencies?: string[] };

  if (!specApproved(root, module.spec)) {
    throw new Error(`Spec ${module.spec} is not APPROVED. Human product approval is required.`);
  }
  const blocked = (module.dependencies ?? []).filter(dep => !moduleDone(state, dep));
  if (blocked.length) throw new Error("Dependencies not complete: " + blocked.join(", "));

  for (const stage of STAGES) {
    const raw = (module.stages as Record<string, unknown>)[stage];
    const status = typeof raw === "string" ? raw : (raw as { status?: string } | undefined)?.status;
    if (["done", "approved", "skipped"].includes(status ?? "")) continue;

    const result = await runCommand({
      command: "node",
      args: ["--import", "tsx", "harness/scripts/run-batch.ts", "--module", moduleId, "--stage", stage, "--mode", "codex", "--validate", "--score", "--repair-attempts", "2"],
      cwd: root,
      timeoutMs: 60 * 60 * 1000,
    });
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    if (result.exitCode !== 0) throw new Error(`Stage ${stage} runner failed.`);

    const latest = listRunDirs(root).find(dir => dir.includes(`-${moduleId}-${stage}`));
    if (!latest) throw new Error(`No run metrics found for ${moduleId}/${stage}`);
    const metrics = readRunMetrics(latest);
    const stageState = (module.stages as Record<string, any>)[stage];
    if (metrics.verdict !== "APPROVED" || (metrics.score ?? 0) < 90) {
      if (typeof stageState === "object") {
        stageState.status = "rejected";
        stageState.runDir = latest;
        stageState.score = metrics.score;
        stageState.notes = "Autopilot stopped: gate not approved after repair loop.";
      }
      writeState(root, state);
      appendEvent(root, { event: "autopilot.escalation", module: moduleId, stage, runDir: latest, score: metrics.score, verdict: metrics.verdict });
      throw new Error(`Autopilot stopped at ${moduleId}/${stage}: ${metrics.verdict} score=${metrics.score}`);
    }

    if (typeof stageState === "object") {
      stageState.status = "approved";
      stageState.runDir = latest;
      stageState.score = metrics.score;
      stageState.approvedAt = new Date().toISOString();
    }
    (state as ProjectState & { current_stage?: Stage }).current_stage = STAGES[STAGES.indexOf(stage) + 1] ?? stage;
    writeState(root, state);
    appendEvent(root, { event: "stage.approved", module: moduleId, stage, runDir: latest, score: metrics.score });
  }

  module.status = "complete";
  writeState(root, state);
  appendEvent(root, { event: "module.done", module: moduleId });
  process.stdout.write(`\nModule ${moduleId} completed all routine gates. Remote merge/deploy remains human-controlled.\n`);
}

main().catch((err: Error) => {
  process.stderr.write("autopilot failed: " + err.message + "\n");
  process.exit(1);
});
