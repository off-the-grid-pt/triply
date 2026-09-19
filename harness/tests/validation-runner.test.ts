import { test } from "node:test";
import assert from "node:assert/strict";
import { runValidation, formatValidationResult } from "../lib/validation-runner";
import type { RunValidationInput } from "../lib/validation-runner";
import type { CommandResult } from "../lib/process-runner";

// ─── Fake async runner for testing ───────────────────────────────────────────

type AsyncRunner = (
  input: { command: string; args: string[]; cwd: string; timeoutMs: number }
) => Promise<CommandResult>;

function fakeRunner(
  map: Record<string, { exitCode: number | null; timedOut?: boolean }>
): AsyncRunner {
  return async ({ command, args }) => {
    const key = [command, ...args].join(" ");
    const r = map[key] ?? { exitCode: 0 };
    return {
      command: key,
      exitCode: r.exitCode,
      timedOut: Boolean(r.timedOut),
      stdout: "",
      stderr: "",
      error: r.exitCode !== 0 ? `exit code ${r.exitCode}` : null,
      durationMs: 10,
    };
  };
}

async function runWithFake(
  opts: Partial<RunValidationInput> & { fakeMap?: Record<string, { exitCode: number | null; timedOut?: boolean }> }
) {
  const { fakeMap = {}, ...rest } = opts;
  return runValidation({
    cwd: "/tmp/test",
    runner: fakeRunner(fakeMap),
    ...rest,
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test("runValidation returns structured result", async () => {
  const result = await runWithFake({ skipTest: true, skipE2e: true });
  
  assert.ok(typeof result.ok === "boolean", "ok should be boolean");
  assert.ok(Array.isArray(result.steps), "steps should be array");
  assert.ok(Array.isArray(result.failed), "failed should be array");
  assert.ok(typeof result.log === "string", "log should be string");
  
  // tsc and build should have run
  const tscStep = result.steps.find(s => s.key === "tsc");
  const buildStep = result.steps.find(s => s.key === "build");
  assert.ok(tscStep, "tsc step should exist");
  assert.ok(buildStep, "build step should exist");
  
  // skipped steps should be present
  const testStep = result.steps.find(s => s.key === "test");
  const e2eStep = result.steps.find(s => s.key === "test_e2e");
  assert.ok(testStep, "test step should exist");
  assert.ok(e2eStep, "test_e2e step should exist");
  assert.equal(testStep?.status, "skipped", "test should be skipped");
  assert.equal(e2eStep?.status, "skipped", "test_e2e should be skipped");
});

test("runValidation requires cwd", async () => {
  await assert.rejects(
    () => runValidation({ cwd: "" }),
    /cwd is required/
  );
});

test("validation result has ok=false when failed array is non-empty", async () => {
  const result = await runWithFake({ skipTest: true, skipE2e: true });
  // ok should match failed array
  if (result.failed.length > 0) {
    assert.equal(result.ok, false);
  } else {
    assert.equal(result.ok, true);
  }
});

test("formatValidationResult produces human-readable output", async () => {
  const result = await runWithFake({ skipTest: true, skipE2e: true });
  const text = formatValidationResult(result);
  assert.ok(typeof text === "string", "should return string");
  assert.match(text, /Validation Results/);
  // Should have lines for each step
  for (const step of result.steps) {
    assert.ok(text.includes(step.label), "should mention: " + step.label);
  }
});

test("step keys are correct", async () => {
  const result = await runWithFake({ skipTest: true, skipE2e: true });
  const keys = result.steps.map(s => s.key);
  assert.ok(keys.includes("tsc"), "should have tsc");
  assert.ok(keys.includes("build"), "should have build");
  assert.ok(keys.includes("test"), "should have test");
  assert.ok(keys.includes("test_e2e"), "should have test_e2e");
});
