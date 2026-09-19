import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createMetrics,
  markCompleted,
  markApproved,
  markRejected,
  setValidationResult,
  setScoreResult,
  validationPassed,
} from "../lib/metrics";

// ─── createMetrics ────────────────────────────────────────────────────────────

test("createMetrics returns correct initial shape", () => {
  const m = createMetrics({
    module: "01-auth-onboarding",
    stage: "frontend",
    agent: "Agente Frontend",
    branch: "feat/modulo-01-auth-onboarding",
    startedAt: "2026-06-01T12:00:00.000Z",
  });

  assert.equal(m.module, "01-auth-onboarding");
  assert.equal(m.stage, "frontend");
  assert.equal(m.agent, "Agente Frontend");
  assert.equal(m.branch, "feat/modulo-01-auth-onboarding");
  assert.equal(m.status, "created");
  assert.equal(m.verdict, "IN_PROGRESS");
  assert.equal(m.startedAt, "2026-06-01T12:00:00.000Z");
  assert.equal(m.endedAt, null);
  assert.equal(m.durationSeconds, null);
  assert.equal(m.score, null);
  assert.deepEqual(m.filesChanged, []);
  assert.deepEqual(m.validation, {
    tsc: null,
    build: null,
    test: null,
    test_e2e: null,
  });
  assert.deepEqual(m.specCompliance, {
    regraNegocio: null,
    casosErro: null,
    fluxos: null,
    designSystem: null,
  });
});

// ─── markCompleted ────────────────────────────────────────────────────────────

test("markCompleted fills endedAt, duration, filesChanged, and status", () => {
  const m = createMetrics({
    module: "01-auth-onboarding",
    stage: "frontend",
    agent: "Agente Frontend",
    branch: "feat/modulo-01-auth-onboarding",
    startedAt: "2026-06-01T12:00:00.000Z",
  });

  markCompleted(m, {
    endedAt: "2026-06-01T12:01:30.000Z",
    filesChanged: ["src/app/(auth)/login/page.tsx", "src/features/auth/screens/LoginScreen.tsx"],
  });

  assert.equal(m.status, "agent_done");
  assert.equal(m.endedAt, "2026-06-01T12:01:30.000Z");
  assert.equal(m.durationSeconds, 90);
  assert.deepEqual(m.filesChanged, [
    "src/app/(auth)/login/page.tsx",
    "src/features/auth/screens/LoginScreen.tsx",
  ]);
});

// ─── setValidationResult ─────────────────────────────────────────────────────

test("setValidationResult merges partial validation steps", () => {
  const m = createMetrics({
    module: "01-auth-onboarding",
    stage: "frontend",
    agent: "Agente Frontend",
    branch: "feat/modulo-01-auth-onboarding",
  });

  setValidationResult(m, { tsc: "pass", build: "pass" });

  assert.equal(m.validation.tsc, "pass");
  assert.equal(m.validation.build, "pass");
  assert.equal(m.validation.test, null);
  assert.equal(m.validation.test_e2e, null);
  assert.equal(m.status, "validated");
});

test("setValidationResult with all steps pass", () => {
  const m = createMetrics({
    module: "02-trips",
    stage: "backend",
    agent: "Agente Backend",
    branch: "feat/modulo-02-trips",
  });

  setValidationResult(m, { tsc: "pass", build: "pass", test: "pass", test_e2e: "pass" });
  assert.equal(validationPassed(m), true);
});

test("setValidationResult with a failed step", () => {
  const m = createMetrics({
    module: "02-trips",
    stage: "backend",
    agent: "Agente Backend",
    branch: "feat/modulo-02-trips",
  });

  setValidationResult(m, { tsc: "fail", build: "pass", test: "pass", test_e2e: "skipped" });
  assert.equal(validationPassed(m), false);
});

// ─── setScoreResult ───────────────────────────────────────────────────────────

test("setScoreResult writes score, verdict, and status", () => {
  const m = createMetrics({
    module: "01-auth-onboarding",
    stage: "frontend",
    agent: "Agente Frontend",
    branch: "feat/modulo-01-auth-onboarding",
  });

  setScoreResult(m, { score: 85, verdict: "NEEDS_CHANGES" });

  assert.equal(m.score, 85);
  assert.equal(m.verdict, "NEEDS_CHANGES");
  assert.equal(m.status, "scored");
});

// ─── markApproved / markRejected ─────────────────────────────────────────────

test("markApproved sets verdict and status correctly", () => {
  const m = createMetrics({
    module: "01-auth-onboarding",
    stage: "qa",
    agent: "Agente QA",
    branch: "feat/modulo-01-auth-onboarding",
    startedAt: "2026-06-01T12:00:00.000Z",
  });

  markApproved(m, { endedAt: "2026-06-01T12:05:00.000Z" });

  assert.equal(m.verdict, "APPROVED");
  assert.equal(m.status, "approved");
  assert.equal(m.durationSeconds, 300);
});

test("markRejected sets verdict and status correctly", () => {
  const m = createMetrics({
    module: "01-auth-onboarding",
    stage: "qa",
    agent: "Agente QA",
    branch: "feat/modulo-01-auth-onboarding",
    startedAt: "2026-06-01T12:00:00.000Z",
  });

  markRejected(m, { endedAt: "2026-06-01T12:03:00.000Z" });

  assert.equal(m.verdict, "REJECTED");
  assert.equal(m.status, "rejected");
  assert.equal(m.durationSeconds, 180);
});
