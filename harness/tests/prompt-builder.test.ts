import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPrompt, buildRepairPrompt } from "../lib/prompt-builder";
import type { BatchContext } from "../lib/prompt-builder";

const repoRoot = process.cwd();

const baseBatch: BatchContext = {
  module: "01-auth-onboarding",
  stage: "frontend",
  agent: "Agente Frontend",
  goal: "Implementar as telas de login, registro e recuperação de senha.",
  allowedFiles: [
    "app/(auth)/login/page.tsx",
    "src/features/auth/screens/LoginScreen.tsx",
    "src/features/auth/hooks/useAuth.ts",
  ],
  forbiddenFiles: [
    "app/api/**",
    "harness/**",
  ],
  validationCommands: [
    "npx tsc --noEmit",
    "npm run build",
    "npm run test",
  ],
  specPath: "spec/01-auth-onboarding.md",
  batchFile: "harness/batches/modulo-01-auth-onboarding-frontend.md",
};

// ─── buildPrompt ──────────────────────────────────────────────────────────────

test("prompt includes the module and stage", () => {
  const prompt = buildPrompt({ repoRoot, batch: baseBatch, runDir: "/tmp/run-x" });
  assert.ok(prompt.includes("01-auth-onboarding"), "prompt missing module");
  assert.ok(prompt.includes("frontend"), "prompt missing stage");
});

test("prompt includes the goal", () => {
  const prompt = buildPrompt({ repoRoot, batch: baseBatch, runDir: "/tmp/run-x" });
  assert.ok(prompt.includes(baseBatch.goal), "prompt missing goal");
});

test("prompt lists every allowed file", () => {
  const prompt = buildPrompt({ repoRoot, batch: baseBatch, runDir: "/tmp/run-x" });
  for (const f of baseBatch.allowedFiles) {
    assert.ok(prompt.includes(f), "prompt missing allowed file: " + f);
  }
});

test("prompt lists every forbidden file", () => {
  const prompt = buildPrompt({ repoRoot, batch: baseBatch, runDir: "/tmp/run-x" });
  for (const f of baseBatch.forbiddenFiles) {
    assert.ok(prompt.includes(f), "prompt missing forbidden file: " + f);
  }
});

test("prompt includes validation commands", () => {
  const prompt = buildPrompt({ repoRoot, batch: baseBatch, runDir: "/tmp/run-x" });
  for (const cmd of baseBatch.validationCommands) {
    assert.ok(prompt.includes(cmd), "prompt missing command: " + cmd);
  }
});

test("prompt includes execution rules block", () => {
  const prompt = buildPrompt({ repoRoot, batch: baseBatch, runDir: "/tmp/run-x" });
  assert.match(prompt, /## Execution Rules/);
  assert.ok(prompt.includes("Agente Frontend"), "prompt missing agent name");
});

test("prompt includes run dir", () => {
  const prompt = buildPrompt({ repoRoot, batch: baseBatch, runDir: "/tmp/run-x" });
  assert.ok(prompt.includes("/tmp/run-x"), "prompt missing run dir");
});

test("prompt does not contain unfilled placeholders", () => {
  const prompt = buildPrompt({ repoRoot, batch: baseBatch, runDir: "/tmp/run-x" });
  assert.doesNotMatch(prompt, /<<[^>]+>>/, "prompt contains unfilled placeholder");
});

test("prompt does not duplicate allowed files section", () => {
  const prompt = buildPrompt({ repoRoot, batch: baseBatch, runDir: "/tmp/run-x" });
  const matches = prompt.match(/## Allowed Files/g) ?? [];
  assert.equal(matches.length, 1);
});

test("prompt does not duplicate forbidden files section", () => {
  const prompt = buildPrompt({ repoRoot, batch: baseBatch, runDir: "/tmp/run-x" });
  const matches = prompt.match(/## Forbidden Files/g) ?? [];
  assert.equal(matches.length, 1);
});

test("prompt includes default forbidden files even when not specified", () => {
  const batch: BatchContext = { ...baseBatch, forbiddenFiles: [] };
  const prompt = buildPrompt({ repoRoot, batch, runDir: "/tmp/run-x" });
  assert.ok(prompt.includes("spec/*.md"), "should include default spec protection");
  assert.ok(prompt.includes("CLAUDE.md"), "should include CLAUDE.md protection");
  assert.ok(prompt.includes(".env.local"), "should include env protection");
});

// ─── buildRepairPrompt ────────────────────────────────────────────────────────

test("repair prompt includes module and stage", () => {
  const prompt = buildRepairPrompt({
    batch: baseBatch,
    validationOutput: "tsc --noEmit failed: 3 errors",
    score: 70,
    verdict: "NEEDS_CHANGES",
    attempt: 1,
  });
  assert.ok(prompt.includes("01-auth-onboarding"), "missing module");
  assert.ok(prompt.includes("frontend"), "missing stage");
});

test("repair prompt includes validation output", () => {
  const validationOutput = "tsc --noEmit failed: 3 errors";
  const prompt = buildRepairPrompt({
    batch: baseBatch,
    validationOutput,
    score: 70,
    verdict: "NEEDS_CHANGES",
  });
  assert.ok(prompt.includes(validationOutput), "missing validation output");
});

test("repair prompt includes score and verdict", () => {
  const prompt = buildRepairPrompt({
    batch: baseBatch,
    score: 70,
    verdict: "NEEDS_CHANGES",
  });
  assert.ok(prompt.includes("70"), "missing score");
  assert.ok(prompt.includes("NEEDS_CHANGES"), "missing verdict");
});

test("repair prompt includes the original goal", () => {
  const prompt = buildRepairPrompt({ batch: baseBatch });
  assert.ok(prompt.includes(baseBatch.goal), "missing original goal");
});

test("repair prompt includes repair attempt number", () => {
  const prompt = buildRepairPrompt({ batch: baseBatch, attempt: 2 });
  assert.ok(prompt.includes("2"), "missing attempt number");
});
