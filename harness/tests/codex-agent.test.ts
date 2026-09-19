import { test } from "node:test";
import assert from "node:assert/strict";
import { runCodexAgent } from "../lib/agents/codex";
import type { AgentCommandRunner } from "../lib/agent-runner";
import type { RunCommandInput } from "../lib/process-runner";

function baseInput() {
  return {
    repoRoot: "/repo/triply",
    runDir: "/repo/triply/harness/runs/run-1",
    prompt: "Implement the batch.",
    resultPath: "/repo/triply/harness/runs/run-1/result.md",
    timeoutMs: 12345,
  };
}

function assertCaptured(value: RunCommandInput | null): RunCommandInput {
  assert.ok(value, "runner should be called");
  return value;
}

test("Codex adapter invokes codex exec with prompt on stdin", async () => {
  let captured: RunCommandInput | null = null;
  const runner: AgentCommandRunner = async input => {
    captured = input;
    return {
      command: [input.command, ...(input.args ?? [])].join(" "),
      exitCode: 0,
      timedOut: false,
      stdout: "done",
      stderr: "",
      error: null,
      durationMs: 10,
    };
  };

  const result = await runCodexAgent(baseInput(), { commandRunner: runner });

  assert.equal(result.ok, true);
  assert.equal(result.mode, "codex");
  const call = assertCaptured(captured);
  assert.equal(call.command, "codex");
  assert.deepEqual(call.args?.slice(0, 3), ["--ask-for-approval", "never", "exec"]);
  assert.ok(call.args?.includes("--sandbox"));
  assert.ok(call.args?.includes("workspace-write"));
  assert.ok(call.args?.includes("--output-last-message"));
  assert.ok(call.args?.includes(baseInput().resultPath));
  assert.equal(call.args?.at(-1), "-");
  assert.equal(call.stdin, baseInput().prompt);
  assert.equal(call.cwd, baseInput().repoRoot);
  assert.equal(call.timeoutMs, baseInput().timeoutMs);
});

test("Codex adapter includes model override when provided", async () => {
  let captured: RunCommandInput | null = null;
  const runner: AgentCommandRunner = async input => {
    captured = input;
    return {
      command: [input.command, ...(input.args ?? [])].join(" "),
      exitCode: 0,
      timedOut: false,
      stdout: "",
      stderr: "",
      error: null,
      durationMs: 1,
    };
  };

  await runCodexAgent(baseInput(), {
    commandRunner: runner,
    model: "gpt-5-codex",
  });

  const call = assertCaptured(captured);
  assert.ok(call.args?.includes("--model"));
  assert.ok(call.args?.includes("gpt-5-codex"));
});

test("Codex adapter reports failure without throwing", async () => {
  const runner: AgentCommandRunner = async input => ({
    command: [input.command, ...(input.args ?? [])].join(" "),
    exitCode: 1,
    timedOut: false,
    stdout: "",
    stderr: "failed",
    error: "codex failed",
    durationMs: 1,
  });

  const result = await runCodexAgent(baseInput(), { commandRunner: runner });

  assert.equal(result.ok, false);
  assert.equal(result.exitCode, 1);
  assert.equal(result.error, "codex failed");
  assert.match(result.output, /failed/);
});
