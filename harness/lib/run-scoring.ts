// run-scoring.ts — combines validation and scope gates into one verdict.

import { calculateScore, summarizeScore, type ScoreFlags, type ScoreResult, type ValidationSteps } from "./scoring";
import { hasCompleteValidation } from "./validation-parser";

export interface ScoreRunInput {
  validation: ValidationSteps;
  flags?: ScoreFlags;
}

export interface ScoreRunResult extends ScoreResult {
  hardGateFailed: boolean;
}

export function scoreRun({ validation, flags = {} }: ScoreRunInput): ScoreRunResult {
  const missingValidation = !hasCompleteValidation(validation);
  const hardGateFailed =
    missingValidation ||
    validation.tsc === "fail" ||
    validation.build === "fail" ||
    validation.test === "fail" ||
    validation.test_e2e === "fail";

  const result = calculateScore({
    validation,
    flags: {
      ...flags,
      missingValidation,
    },
  });

  return {
    ...result,
    verdict: hardGateFailed && result.verdict === "APPROVED" ? "NEEDS_CHANGES" : result.verdict,
    hardGateFailed,
  };
}

export function summarizeRunScore(result: ScoreRunResult, validation: ValidationSteps): string {
  return [
    summarizeScore(result),
    "",
    "Validation Steps:",
    "  tsc:      " + (validation.tsc ?? "not run"),
    "  build:    " + (validation.build ?? "not run"),
    "  test:     " + (validation.test ?? "not run"),
    "  test_e2e: " + (validation.test_e2e ?? "not run"),
    "",
    result.hardGateFailed
      ? "NOTE: Hard gate failed or validation incomplete — APPROVED not possible."
      : "",
  ].filter(Boolean).join("\n") + "\n";
}
