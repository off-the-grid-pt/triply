import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isUnrepairable,
  needsRepair,
  SCORE_FLOOR,
  SCORE_THRESHOLD,
} from "../lib/types";
import type { AgentFailureKind } from "../lib/types";

// ─── isUnrepairable ───────────────────────────────────────────────────────────

test("quota_exceeded is unrepairable", () => {
  assert.equal(isUnrepairable("quota_exceeded"), true);
});

test("auth_error is unrepairable", () => {
  assert.equal(isUnrepairable("auth_error"), true);
});

test("agent_failed is repairable", () => {
  assert.equal(isUnrepairable("agent_failed"), false);
});

test("spec_violation is repairable", () => {
  assert.equal(isUnrepairable("spec_violation"), false);
});

test("design_violation is repairable", () => {
  assert.equal(isUnrepairable("design_violation"), false);
});

test("none is repairable", () => {
  assert.equal(isUnrepairable("none"), false);
});

// ─── needsRepair ──────────────────────────────────────────────────────────────

test("APPROVED never needs repair", () => {
  assert.equal(needsRepair("APPROVED", 100), false);
  assert.equal(needsRepair("APPROVED", 95), false);
});

test("REJECTED always needs repair", () => {
  assert.equal(needsRepair("REJECTED", 40), true);
  assert.equal(needsRepair("REJECTED", null), true);
});

test("NEEDS_CHANGES always needs repair", () => {
  assert.equal(needsRepair("NEEDS_CHANGES", 75), true);
});

test("IN_PROGRESS with score above threshold does not need repair", () => {
  assert.equal(needsRepair("IN_PROGRESS", 95), false);
});

test("IN_PROGRESS with score in repair band needs repair", () => {
  assert.equal(needsRepair("IN_PROGRESS", 75), true);
  assert.equal(needsRepair("IN_PROGRESS", SCORE_FLOOR), true);
});

test("IN_PROGRESS with score below floor does not need repair", () => {
  assert.equal(needsRepair("IN_PROGRESS", 50), false);
});

test("score thresholds have correct values", () => {
  assert.equal(SCORE_FLOOR, 60);
  assert.equal(SCORE_THRESHOLD, 90);
});
