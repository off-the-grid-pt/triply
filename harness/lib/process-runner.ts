// process-runner.ts — Execa wrapper for bounded harness commands.
//
// Used to run validation commands (tsc, build, test, test:e2e)
// and capture their output for logging and scoring.
// Never used to invoke Claude or Codex — agents run manually in Cursor.

import { ensureDir } from './file-utils';
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export interface RunCommandInput {
  command: string;
  args?: string[];
  cwd?: string;
  timeoutMs?: number;
  stdin?: string;
}

export interface CommandResult {
  command: string;
  exitCode: number | null;
  timedOut: boolean;
  stdout: string;
  stderr: string;
  error: string | null;
  durationMs: number | null;
}

export async function runCommand({
  command,
  args = [],
  cwd = process.cwd(),
  timeoutMs = 120_000, // 2 minutes default
  stdin,
}: RunCommandInput): Promise<CommandResult> {
  const { execa } = await import('execa');
  const start = Date.now();

  const result = await execa(command, args, {
    cwd,
    reject: false,
    timeout: timeoutMs,
    all: true,
    input: stdin,
  });

  const durationMs = Date.now() - start;

  return {
    command: [command, ...args].join(' '),
    exitCode: typeof result.exitCode === 'number' ? result.exitCode : null,
    timedOut: Boolean(result.timedOut),
    stdout: typeof result.stdout === 'string' ? result.stdout : '',
    stderr: typeof result.stderr === 'string' ? result.stderr : '',
    error: result.timedOut
      ? `Command timed out after ${timeoutMs}ms`
      : result.exitCode !== 0
        ? result.shortMessage ?? null
        : null,
    durationMs,
  };
}

// Run a command and write combined output to a log file
export async function runCommandToFile(
  input: RunCommandInput,
  logFile: string
): Promise<CommandResult> {
  const result = await runCommand(input);
  const output = [
    `$ ${result.command}`,
    result.stdout,
    result.stderr,
    result.timedOut ? `\n[TIMED OUT after ${input.timeoutMs ?? 120000}ms]` : '',
    `\n[exit code: ${result.exitCode}]`,
  ]
    .filter(Boolean)
    .join('\n');

  ensureDir(dirname(logFile));
  writeFileSync(logFile, output);

  return result;
}
