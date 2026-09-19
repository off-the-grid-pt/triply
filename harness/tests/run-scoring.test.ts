import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreRun } from "../lib/run-scoring";

test("scoreRun cannot approve when validation did not run", () => {
  const result = scoreRun({
    validation: { tsc: null, build: null, test: null, test_e2e: null },
  });

  assert.equal(result.verdict, "NEEDS_CHANGES");
  assert.equal(result.hardGateFailed, true);
  assert.ok(result.deductions.some(d => d.key === "missingValidation"));
});

test("scoreRun cannot approve when scope violations exist", () => {
  const result = scoreRun({
    validation: { tsc: "pass", build: "pass", test: "pass", test_e2e: "pass" },
    flags: { scopeViolation: true },
  });

  assert.equal(result.verdict, "NEEDS_CHANGES");
  assert.ok(result.deductions.some(d => d.key === "forbiddenFiles"));
});

test("scoreRun cannot approve when unit tests fail", () => {
  const result = scoreRun({
    validation: { tsc: "pass", build: "pass", test: "fail", test_e2e: "pass" },
  });

  assert.equal(result.verdict, "NEEDS_CHANGES");
  assert.equal(result.hardGateFailed, true);
});

test("scoreRun cannot approve when e2e tests fail", () => {
  const result = scoreRun({
    validation: { tsc: "pass", build: "pass", test: "pass", test_e2e: "fail" },
  });

  assert.equal(result.verdict, "NEEDS_CHANGES");
  assert.equal(result.hardGateFailed, true);
});
