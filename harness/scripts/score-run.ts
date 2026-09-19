#!/usr/bin/env node
// score-run.ts — apply the scorecard to a finished run.
//
// Usage:
//   npm run harness:score
//   node --import tsx harness/scripts/score-run.ts <run-dir>
//
// Reads metrics.json and validation.log.
// Applies harness/scorecards/triply-scorecard.md via harness/lib/scoring.ts.
// Writes score.txt and updates metrics.json.
// Appends run.score event to harness/logs/events.jsonl.

import { join, resolve } from "node:path";
import { fileExists, readText } from "../lib/file-utils";
import { setScoreResult, setValidationResult } from "../lib/metrics";
import { appendEvent, readRunMetrics, writeRunMetrics, writeScore } from "../lib/run-state";
import { scoreRun, summarizeRunScore } from "../lib/run-scoring";
import { parseValidationLog } from "../lib/validation-parser";
import type { ScoreFlags, ValidationSteps } from "../lib/scoring";

function usage(msg?: string): never {
  if (msg) process.stderr.write("error: " + msg + "\n");
  process.stderr.write("usage: node --import tsx harness/scripts/score-run.ts <run-dir>\n");
  process.exit(2);
}

function main(): void {
  const runDirArg = process.argv[2];
  if (!runDirArg) usage("missing run directory");

  const repoRoot = process.cwd();
  const runDir = resolve(repoRoot, runDirArg);

  const metrics = readRunMetrics(runDir);

  // Parse validation.log if present
  const validationLogPath = join(runDir, "validation.log");
  let validationSteps: ValidationSteps = {
    tsc: metrics.validation.tsc,
    build: metrics.validation.build,
    test: metrics.validation.test,
    test_e2e: metrics.validation.test_e2e,
  };

  if (fileExists(validationLogPath)) {
    const logText = readText(validationLogPath);
    const parsed = parseValidationLog(logText);
    // Merge parsed results with existing metrics (metrics win if already set)
    validationSteps = {
      tsc: metrics.validation.tsc ?? parsed.tsc,
      build: metrics.validation.build ?? parsed.build,
      test: metrics.validation.test ?? parsed.test,
      test_e2e: metrics.validation.test_e2e ?? parsed.test_e2e,
    };
    setValidationResult(metrics, validationSteps);
  }

  // Build score flags from validation results
  const flags: ScoreFlags = {
    // Validation failures
  };

  // Check for any in TypeScript (basic heuristic)
  // QA agent will set proper flags — here we rely on validation steps
  const result = scoreRun({
    validation: validationSteps,
    flags,
  });

  // Update metrics with score
  setScoreResult(metrics, {
    score: result.score,
    verdict: result.verdict,
  });
  writeRunMetrics(runDir, metrics);

  // Write score.txt
  const scoreSummary = summarizeRunScore(result, validationSteps);

  writeScore(runDir, scoreSummary);

  // Log event
  appendEvent(repoRoot, {
    event: "run.score",
    module: metrics.module,
    stage: metrics.stage,
    agent: metrics.agent,
    runDir,
    score: result.score,
    verdict: result.verdict,
  });

  process.stdout.write(scoreSummary + "\n");
}

main();
