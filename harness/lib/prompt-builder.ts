// prompt-builder.ts — assemble the implementation prompt for an agent.
//
// Concatenates (in order):
//   1. AGENTS.md (root) — architecture contract
//   2. harness/AGENTS.md — harness-specific contract
//   3. The concrete batch definition — allowed/forbidden files, goal, validation commands
//
// Output is written to harness/runs/<run-dir>/prompt.md

import { join } from 'node:path';
import { fileExists, readText, writeText } from './file-utils';
import type { ModuleId, Stage } from './types';

const DIVIDER = '\n\n---\n\n';

export interface BatchContext {
  module: ModuleId;
  stage: Stage;
  agent: string;
  goal: string;
  allowedFiles: string[];
  forbiddenFiles: string[];
  validationCommands: string[];
  architectureNotes?: string;
  specPath: string;
  batchFile: string;
}

function renderAllowedFiles(files: string[]): string {
  return files.length === 0
    ? '(none declared)'
    : files.map(f => `- ${f}`).join('\n');
}

function renderForbiddenFiles(files: string[]): string {
  const defaults = [
    'spec/*.md — never alter specs',
    'CLAUDE.md — never alter the orchestrator',
    'AGENTS.md — never alter the agent contract',
    'project-state.json — only the orchestrator updates this',
    'harness/** — do not touch the harness during implementation',
    '.env.local — never alter credentials',
  ];
  const all = [...defaults, ...files.filter(f => !defaults.some(d => d.startsWith(f)))];
  return all.map(f => `- ${f}`).join('\n');
}

function renderValidationCommands(commands: string[]): string {
  const defaults = [
    'npx tsc --noEmit',
    'npm run build',
    'npm run test',
    'npm run test:e2e',
  ];
  const all = commands.length > 0 ? commands : defaults;
  return '```bash\n' + all.join('\n') + '\n```';
}

function renderExecutionRules(ctx: BatchContext, runDir: string): string {
  return [
    '## Execution Rules',
    '',
    `- Module: \`${ctx.module}\``,
    `- Stage: \`${ctx.stage}\``,
    `- Agent: ${ctx.agent}`,
    `- Spec: \`${ctx.specPath}\``,
    `- Batch file: \`${ctx.batchFile}\``,
    `- Run directory: \`${runDir}\``,
    '',
    '- Implement only what is in the spec. Never invent behavior.',
    '- Never touch files outside the allowed scope above.',
    '- Never modify package.json or package-lock.json.',
    '- Never push, merge, or delete branches.',
    '- Report bugs found during implementation — never silently fix them.',
    '- Error messages must match the spec exactly — same Portuguese text.',
    '- Use the strict output format from AGENTS.md Section 11.',
  ].join('\n');
}

export interface BuildPromptInput {
  repoRoot: string;
  batch: BatchContext;
  runDir: string;
}

export function buildPrompt({ repoRoot, batch, runDir }: BuildPromptInput): string {
  const sections: string[] = [];

  // 1. Root AGENTS.md
  const rootAgents = join(repoRoot, 'AGENTS.md');
  if (fileExists(rootAgents)) {
    sections.push(readText(rootAgents).trim());
  }

  // 2. Harness AGENTS.md
  const harnessAgents = join(repoRoot, 'harness', 'AGENTS.md');
  if (fileExists(harnessAgents)) {
    sections.push(readText(harnessAgents).trim());
  }

  // 3. Batch definition. Do not include the raw implementation template here:
  // it contains placeholders and section headings that make agent prompts ambiguous.
  const batchSection = [
    `# Batch — Módulo ${batch.module} — Etapa: ${batch.stage}`,
    '',
    '## Goal',
    '',
    batch.goal,
    '',
    batch.architectureNotes
      ? `## Architecture Notes\n\n${batch.architectureNotes}\n`
      : '',
    '## Allowed Files',
    '',
    renderAllowedFiles(batch.allowedFiles),
    '',
    '## Forbidden Files',
    '',
    renderForbiddenFiles(batch.forbiddenFiles),
    '',
    '## Validation Commands',
    '',
    renderValidationCommands(batch.validationCommands),
    '',
    renderExecutionRules(batch, runDir),
  ].filter(s => s !== undefined).join('\n');

  sections.push(batchSection.trim());

  return sections.join(DIVIDER).trim() + '\n';
}

export function writePromptFile({ repoRoot, batch, runDir }: BuildPromptInput): string {
  const prompt = buildPrompt({ repoRoot, batch, runDir });
  return writeText(join(runDir, 'prompt.md'), prompt);
}

export interface BuildRepairPromptInput {
  batch: BatchContext;
  validationOutput?: string;
  score?: number | null;
  verdict?: string | null;
  attempt?: number;
}

export function buildRepairPrompt({
  batch,
  validationOutput,
  score,
  verdict,
  attempt = 1,
}: BuildRepairPromptInput): string {
  return [
    `# Repair Attempt ${attempt} — Módulo ${batch.module} — Etapa: ${batch.stage}`,
    '',
    '## Original Goal',
    '',
    batch.goal,
    '',
    '## Validation Output',
    '',
    '```text',
    (validationOutput ?? '(no validation output)').trim(),
    '```',
    '',
    '## Current Score',
    '',
    `Score: ${score == null ? 'not scored' : score}`,
    `Verdict: ${verdict ?? 'unknown'}`,
    '',
    '## Instruction',
    '',
    'Fix only the issues required to pass validation.',
    'Do not expand scope beyond the allowed files.',
    'Do not add new dependencies.',
    'Error messages must match the spec exactly.',
    'Report what was fixed and re-run validation.',
  ].join('\n') + '\n';
}
