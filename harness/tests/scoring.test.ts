import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateScore,
  getVerdict,
  shouldAttemptRepair,
  summarizeScore,
  SCORE_APPROVED,
  SCORE_FLOOR,
} from "../lib/scoring";
import type { ScoreInput } from "../lib/scoring";

// ─── getVerdict ───────────────────────────────────────────────────────────────

test("score >= 90 is APPROVED", () => {
  assert.equal(getVerdict(100), "APPROVED");
  assert.equal(getVerdict(90), "APPROVED");
});

test("score 60-89 is NEEDS_CHANGES", () => {
  assert.equal(getVerdict(89), "NEEDS_CHANGES");
  assert.equal(getVerdict(75), "NEEDS_CHANGES");
  assert.equal(getVerdict(60), "NEEDS_CHANGES");
});

test("score < 60 is REJECTED", () => {
  assert.equal(getVerdict(59), "REJECTED");
  assert.equal(getVerdict(0), "REJECTED");
});

test("SCORE_APPROVED and SCORE_FLOOR have correct values", () => {
  assert.equal(SCORE_APPROVED, 90);
  assert.equal(SCORE_FLOOR, 60);
});

// ─── calculateScore — perfect run ────────────────────────────────────────────

test("perfect run scores 100 and is APPROVED", () => {
  const result = calculateScore({
    validation: { tsc: "pass", build: "pass", test: "pass", test_e2e: "pass" },
    flags: {},
  });
  assert.equal(result.score, 100);
  assert.equal(result.verdict, "APPROVED");
  assert.equal(result.deductions.length, 0);
  assert.equal(result.totalDeduction, 0);
});

test("no input produces a 100 score", () => {
  const result = calculateScore();
  assert.equal(result.score, 100);
  assert.equal(result.verdict, "APPROVED");
});

// ─── calculateScore — validation deductions ──────────────────────────────────

test("tsc failure deducts 10 points", () => {
  const result = calculateScore({ validation: { tsc: "fail" } });
  assert.equal(result.score, 90);
  assert.equal(result.verdict, "APPROVED");
  assert.ok(result.deductions.some(d => d.key === "tscFail"));
});

test("build failure deducts 10 points", () => {
  const result = calculateScore({ validation: { build: "fail" } });
  assert.equal(result.score, 90);
  assert.ok(result.deductions.some(d => d.key === "buildFail"));
});

test("test failure deducts 5 points", () => {
  const result = calculateScore({ validation: { test: "fail" } });
  assert.equal(result.score, 95);
  assert.ok(result.deductions.some(d => d.key === "testFail"));
});

test("e2e failure deducts 5 points", () => {
  const result = calculateScore({ validation: { test_e2e: "fail" } });
  assert.equal(result.score, 95);
  assert.ok(result.deductions.some(d => d.key === "e2eFail"));
});

test("tsc + build failure gives NEEDS_CHANGES (80)", () => {
  const result = calculateScore({
    validation: { tsc: "fail", build: "fail" },
  });
  assert.equal(result.score, 80);
  assert.equal(result.verdict, "NEEDS_CHANGES");
});

// ─── calculateScore — spec compliance deductions ─────────────────────────────

test("regra negocio violation deducts 20 points", () => {
  const result = calculateScore({ flags: { regraNegocioViolation: true } });
  assert.equal(result.score, 80);
  assert.equal(result.verdict, "NEEDS_CHANGES");
  assert.ok(result.deductions.some(d => d.key === "regraNegocioViolation"));
});

test("caso erro wrong message deducts 10 points", () => {
  const result = calculateScore({ flags: { casoErroWrongMessage: true } });
  assert.equal(result.score, 90);
  assert.ok(result.deductions.some(d => d.key === "casoErroWrongMessage"));
});

// ─── calculateScore — design system deductions ───────────────────────────────

test("hardcoded color deducts 10 points", () => {
  const result = calculateScore({ flags: { hardcodedColor: true } });
  assert.equal(result.score, 90);
  assert.ok(result.deductions.some(d => d.key === "hardcodedColor"));
});

test("wrong gradient direction deducts 5 points", () => {
  const result = calculateScore({ flags: { wrongGradientDirection: true } });
  assert.equal(result.score, 95);
  assert.ok(result.deductions.some(d => d.key === "wrongGradientDirection"));
});

test("PT-PT text deducts 5 points", () => {
  const result = calculateScore({ flags: { ptPtText: true } });
  assert.equal(result.score, 95);
  assert.ok(result.deductions.some(d => d.key === "ptPtText"));
});

// ─── calculateScore — code quality deductions ────────────────────────────────

test("any type used deducts 10 points", () => {
  const result = calculateScore({ flags: { anyTypeUsed: true } });
  assert.equal(result.score, 90);
  assert.ok(result.deductions.some(d => d.key === "anyTypeUsed"));
});

test("forbidden files deducts 15 points", () => {
  const result = calculateScore({ flags: { forbiddenFiles: true } });
  assert.equal(result.score, 85);
  assert.equal(result.verdict, "NEEDS_CHANGES");
  assert.ok(result.deductions.some(d => d.key === "forbiddenFiles"));
});

test("env local changed deducts 20 points", () => {
  const result = calculateScore({ flags: { envLocalChanged: true } });
  assert.equal(result.score, 80);
  assert.ok(result.deductions.some(d => d.key === "envLocalChanged"));
});

// ─── calculateScore — score is clamped to 0 ──────────────────────────────────

test("score never goes below 0", () => {
  const result = calculateScore({
    validation: { tsc: "fail", build: "fail", test: "fail", test_e2e: "fail" },
    flags: {
      regraNegocioViolation: true,
      casoErroWrongMessage: true,
      fluxoIncomplete: true,
      hardcodedColor: true,
      wrongGradientDirection: true,
      glassOnList: true,
      wrongIcon: true,
      ptPtText: true,
      anyTypeUsed: true,
      forbiddenFiles: true,
      packageJsonChanged: true,
      envLocalChanged: true,
      missingStates: true,
      missingOutputFormat: true,
    },
  });
  assert.equal(result.score, 0);
  assert.equal(result.verdict, "REJECTED");
});

// ─── shouldAttemptRepair ──────────────────────────────────────────────────────

test("APPROVED never attempts repair", () => {
  assert.equal(shouldAttemptRepair({ score: 100, verdict: "APPROVED" }), false);
  assert.equal(shouldAttemptRepair({ score: 90, verdict: "APPROVED" }), false);
});

test("REJECTED always attempts repair", () => {
  assert.equal(shouldAttemptRepair({ score: 40, verdict: "REJECTED" }), true);
});

test("NEEDS_CHANGES attempts repair", () => {
  assert.equal(shouldAttemptRepair({ score: 75, verdict: "NEEDS_CHANGES" }), true);
});

// ─── summarizeScore ───────────────────────────────────────────────────────────

test("summarizeScore includes score, verdict and deductions", () => {
  const result = calculateScore({
    validation: { tsc: "fail", build: "pass" },
    flags: { hardcodedColor: true },
  });
  const text = summarizeScore(result);
  assert.match(text, /Score:/);
  assert.match(text, /Verdict:/);
  assert.match(text, /tsc/i);
  assert.match(text, /hardcoded/i);
});

test("summarizeScore with perfect score says no deductions", () => {
  const result = calculateScore();
  const text = summarizeScore(result);
  assert.match(text, /No deductions/);
  assert.match(text, /APPROVED/);
});
