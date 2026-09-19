// codex.ts — Codex CLI adapter for non-interactive harness runs.

import { runCommand } from "../process-runner";
import type { AgentCommandRunner, AgentRunInput, AgentRunResult } from "../agent-runner";

export interface CodexAgentOptions {
  model?: string;
  sandbox?: "read-only" | "workspace-write" | "danger-full-access";
  approvalPolicy?: "untrusted" | "on-failure" | "on-request" | "never";
  commandRunner?: AgentCommandRunner;
}

export async function runCodexAgent(
  input: AgentRunInput,
  options: CodexAgentOptions = {}
): Promise<AgentRunResult> {
  const {
    model,
    sandbox = "workspace-write",
    approvalPolicy = "never",
    commandRunner = runCommand,
  } = options;

  const args = [
    "--ask-for-approval",
    approvalPolicy,
    "exec",
    "--cd",
    input.repoRoot,
    "--sandbox",
    sandbox,
    "--output-last-message",
    input.resultPath,
    "-",
  ];

  if (model) {
    args.splice(0, 0, "--model", model);
  }

  const result = await commandRunner({
    command: "codex",
    args,
    cwd: input.repoRoot,
    timeoutMs: input.timeoutMs,
    stdin: input.prompt,
  });

  const output = [result.stdout, result.stderr].filter(Boolean).join("\n");

  return {
    ok: result.exitCode === 0 && !result.timedOut,
    mode: "codex",
    command: result.command,
    exitCode: result.exitCode,
    output,
    resultPath: input.resultPath,
    timedOut: result.timedOut,
    error: result.error,
  };
}
