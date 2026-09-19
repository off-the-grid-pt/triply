// validation-parser.ts — parses validation logs into scoreable step status.

import type { ValidationSteps } from "./scoring";

export function parseValidationLog(text: string): ValidationSteps {
  const steps: ValidationSteps = {
    tsc: null,
    build: null,
    test: null,
    test_e2e: null,
  };
  if (!text) return steps;

  const blocks = text.split(/\n(?=###\s+)/);
  for (const block of blocks) {
    const lower = block.toLowerCase();
    const status = lower.includes("[pass]")
      ? "pass"
      : lower.includes("[skip]")
        ? "skipped"
        : lower.includes("[fail]")
          ? "fail"
          : null;

    if (!status) continue;
    if (lower.includes("typescript check") || lower.includes("tsc --noemit") || lower.includes("tsc --no-emit")) {
      steps.tsc = status;
    } else if (lower.includes("next.js build") || lower.includes("npm run build")) {
      steps.build = status;
    } else if (lower.includes("playwright e2e") || lower.includes("npm run test:e2e")) {
      steps.test_e2e = status;
    } else if (lower.includes("vitest tests") || lower.includes("npm run test")) {
      steps.test = status;
    }
  }

  return steps;
}

export function hasCompleteValidation(steps: ValidationSteps): boolean {
  return (
    steps.tsc != null &&
    steps.build != null &&
    steps.test != null &&
    steps.test_e2e != null
  );
}
