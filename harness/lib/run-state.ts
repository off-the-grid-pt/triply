// run-state.ts — manages run folders and artifacts for the Triply harness.
//
// Every run owns a folder under harness/runs/<timestamp>-<module>-<stage>/
// containing:
//   metrics.json    structured record of the run
//   prompt.md       prompt handed to the agent
//   result.md       agent reply (pasted after the run)
//   validation.log  raw output of validation commands
//   score.txt       scorecard verdict and deductions
//   diff.txt        git diff of changed files

import { join } from 'node:path';
import {
  ensureDir,
  fileExists,
  readJson,
  timestampSlug,
  appendLine,
  writeJson,
  writeText,
} from './file-utils';
import { createMetrics } from './metrics';
import type { ModuleId, RunMetrics, Stage } from './types';

export const RUNS_DIRNAME = 'runs';
export const LOGS_DIRNAME = 'logs';

export function harnessPaths(repoRoot: string): {
  harnessRoot: string;
  runsDir: string;
  logsDir: string;
  eventsLog: string;
} {
  const harnessRoot = join(repoRoot, 'harness');
  return {
    harnessRoot,
    runsDir: join(harnessRoot, RUNS_DIRNAME),
    logsDir: join(harnessRoot, LOGS_DIRNAME),
    eventsLog: join(harnessRoot, LOGS_DIRNAME, 'events.jsonl'),
  };
}

export function runDirName({
  module,
  stage,
  date = new Date(),
}: {
  module: ModuleId;
  stage: Stage;
  date?: Date;
}): string {
  return `${timestampSlug(date)}-${module}-${stage}`;
}

export interface CreateRunDirInput {
  repoRoot: string;
  module: ModuleId;
  stage: Stage;
  agent: string;
  branch: string;
  date?: Date;
}

export function createRunDir(input: CreateRunDirInput): {
  runDir: string;
  metrics: RunMetrics;
} {
  const { repoRoot, module, stage, agent, branch, date = new Date() } = input;
  const { runsDir } = harnessPaths(repoRoot);
  const dirName = runDirName({ module, stage, date });
  const runDir = join(runsDir, dirName);

  ensureDir(runDir);

  const metrics = createMetrics({ module, stage, agent, branch });
  writeJson(join(runDir, 'metrics.json'), metrics);

  // Seed placeholder files
  writeText(
    join(runDir, 'prompt.md'),
    `# Prompt — ${module} — ${stage}\n\nAgent: ${agent}\nBranch: ${branch}\n\nPaste the implementation prompt here.\n`
  );
  writeText(
    join(runDir, 'result.md'),
    `# Result — ${module} — ${stage}\n\nAgent: ${agent}\n\nPaste the agent reply here.\n`
  );
  writeText(join(runDir, 'validation.log'), '');
  writeText(join(runDir, 'score.txt'), '');
  writeText(join(runDir, 'diff.txt'), '');

  return { runDir, metrics };
}

export function readRunMetrics(runDir: string): RunMetrics {
  const path = join(runDir, 'metrics.json');
  if (!fileExists(path)) throw new Error(`metrics.json not found in ${runDir}`);
  return readJson<RunMetrics>(path);
}

export function writeRunMetrics(runDir: string, metrics: RunMetrics): void {
  writeJson(join(runDir, 'metrics.json'), metrics);
}

export function writeScore(runDir: string, contents: string): void {
  writeText(join(runDir, 'score.txt'), contents);
}

export function writeDiff(runDir: string, contents: string): void {
  writeText(join(runDir, 'diff.txt'), contents);
}

export function writeValidationLog(runDir: string, contents: string): void {
  writeText(join(runDir, 'validation.log'), contents);
}

// Append a structured event to the global events log
export function appendEvent(
  repoRoot: string,
  event: Record<string, unknown>
): void {
  const { eventsLog } = harnessPaths(repoRoot);
  ensureDir(join(repoRoot, 'harness', LOGS_DIRNAME));
  const line = JSON.stringify({
    version: 1,
    ts: new Date().toISOString(),
    ...event,
  });
  appendLine(eventsLog, line);
}

// List all run dirs sorted newest first
export function listRunDirs(repoRoot: string): string[] {
  const { runsDir } = harnessPaths(repoRoot);
  if (!fileExists(runsDir)) return [];

  const { readdirSync, statSync } = require('node:fs') as typeof import('node:fs');
  try {
    return readdirSync(runsDir)
      .map(name => join(runsDir, name))
      .filter(p => statSync(p).isDirectory())
      .sort((a, b) => b.localeCompare(a)); // newest first
  } catch {
    return [];
  }
}
