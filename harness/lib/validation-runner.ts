// validation-runner.ts — runs validation commands and returns structured results.
//
// Runs these gates in order:
//   npx tsc --noEmit     TypeScript check
//   npm run build        Next.js production build
//   npm run test         Vitest unit + integration tests
//   npm run test:e2e     Playwright E2E tests (optional)
//
// Each step is time-boxed via process-runner so validation cannot hang.

import { runCommand, type CommandResult } from './process-runner';
import type { ValidationResult, ValidationStepKey, ValidationStepResult, ValidationStepStatus } from './types';

const DEFAULT_TIMEOUT_MS = 120_000; // 2 minutes per step

export interface RunValidationInput {
  cwd: string;
  timeoutMs?: number;
  skipE2e?: boolean;        // skip E2E tests (faster, for early stages)
  skipTest?: boolean;       // skip unit tests (for design/database stages)
  runner?: ValidationCommandRunner;
}

export type ValidationCommandRunner = (input: {
  command: string;
  args: string[];
  cwd: string;
  timeoutMs: number;
}) => Promise<CommandResult>;

export async function runValidation({
  cwd,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  skipE2e = false,
  skipTest = false,
  runner = runCommand,
}: RunValidationInput): Promise<ValidationResult> {
  if (!cwd) throw new Error('runValidation: cwd is required');

  const steps: ValidationStepResult[] = [];

  const exec = async (
    key: ValidationStepKey,
    label: string,
    command: string,
    args: string[],
    skip = false
  ): Promise<void> => {
    if (skip) {
      steps.push({
        key,
        label,
        command: [command, ...args].join(' '),
        status: 'skipped',
        exitCode: null,
        output: 'skipped',
      });
      return;
    }

    const result = await runner({ command, args, cwd, timeoutMs });
    const status: ValidationStepStatus = result.timedOut
      ? 'fail'
      : result.exitCode === 0
        ? 'pass'
        : 'fail';

    const output = [
      result.stdout.trimEnd(),
      result.stderr.trimEnd(),
      result.timedOut ? `\n[TIMED OUT after ${timeoutMs}ms]` : '',
    ]
      .filter(Boolean)
      .join('\n');

    steps.push({
      key,
      label,
      command: [command, ...args].join(' '),
      status,
      exitCode: result.exitCode,
      output,
    });
  };

  await exec('tsc', 'TypeScript check', 'npx', ['tsc', '--noEmit']);
  await exec('build', 'Next.js build', 'npm', ['run', 'build']);
  await exec('test', 'Vitest tests', 'npm', ['run', 'test'], skipTest);
  await exec('test_e2e', 'Playwright E2E', 'npm', ['run', 'test:e2e'], skipE2e);

  const failed = steps
    .filter(s => s.status === 'fail')
    .map(s => s.key);

  const ok = failed.length === 0;

  const log = steps
    .map(s => {
      const statusLabel = s.status === 'pass' ? 'PASS' : s.status === 'skipped' ? 'SKIP' : 'FAIL';
      return [
        `### ${s.label} [${statusLabel}]`,
        `$ ${s.command}`,
        `exit=${s.exitCode ?? 'n/a'}`,
        s.output || '(no output)',
      ].join('\n');
    })
    .join('\n\n');

  return { ok, steps, failed, log };
}

export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = ['Validation Results', ''];
  for (const step of result.steps) {
    const icon = step.status === 'pass' ? '✓' : step.status === 'skipped' ? '-' : '✗';
    lines.push(`${icon} ${step.label}: ${step.status.toUpperCase()}`);
  }
  lines.push('');
  lines.push(result.ok ? 'All validation steps passed.' : `Failed steps: ${result.failed.join(', ')}`);
  return lines.join('\n') + '\n';
}
