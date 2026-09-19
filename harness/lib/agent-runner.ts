// agent-runner.ts — shared contracts for live agent adapters.

import type { CommandResult, RunCommandInput } from "./process-runner";

export type AgentMode = "manual" | "claude" | "codex";

export type AgentCommandRunner = (input: RunCommandInput) => Promise<CommandResult>;

export interface AgentRunInput {
  repoRoot: string;
  runDir: string;
  prompt: string;
  resultPath: string;
  timeoutMs: number;
}

export interface AgentRunResult {
  ok: boolean;
  mode: AgentMode;
  command: string;
  exitCode: number | null;
  output: string;
  resultPath: string;
  timedOut: boolean;
  error: string | null;
}
