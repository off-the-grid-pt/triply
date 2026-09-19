// readiness.ts — go/no-go evaluation before the first real module run.
//
// Inspection only — never invokes agents, never runs validation,
// never modifies any file. Checks that the environment is ready.

import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { readJson } from './file-utils';
import type { ProjectState } from './types';

export type CheckStatus = 'ok' | 'warn' | 'fail';

export interface ReadinessCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface ReadinessReport {
  go: boolean;
  hasWarnings: boolean;
  checks: ReadinessCheck[];
  nextAction: string;
}

const REQUIRED_SCRIPTS = [
  { id: 'dev', label: 'Dev server', script: 'dev' },
  { id: 'build', label: 'Build command', script: 'build' },
  { id: 'test', label: 'Test command (Vitest)', script: 'test' },
  { id: 'test-e2e', label: 'E2E test command (Playwright)', script: 'test:e2e' },
  { id: 'test-harness', label: 'Harness test command', script: 'test:harness' },
  { id: 'harness-typecheck', label: 'Harness typecheck command', script: 'harness:typecheck' },
  { id: 'harness-ready', label: 'Harness ready command', script: 'harness:ready' },
  { id: 'harness-start', label: 'Harness start command', script: 'harness:start' },
  { id: 'harness-end', label: 'Harness end command', script: 'harness:end' },
  { id: 'harness-score', label: 'Harness score command', script: 'harness:score' },
  { id: 'agent-run-batch', label: 'Run batch command', script: 'agent:run-batch' },
] as const;

const REQUIRED_FILES = [
  { id: 'claude-md', label: 'Orchestrator (CLAUDE.md)', path: 'CLAUDE.md' },
  { id: 'agents-md', label: 'Agent contract (AGENTS.md)', path: 'AGENTS.md' },
  { id: 'project-state', label: 'Project state (project-state.json)', path: 'project-state.json' },
  { id: 'env-local', label: 'Environment variables (.env.local)', path: '.env.local' },
  { id: 'root-tsconfig', label: 'Root TypeScript config', path: 'tsconfig.json' },
  { id: 'harness-tsconfig', label: 'Harness TypeScript config', path: 'harness/tsconfig.json' },
  { id: 'harness-readme', label: 'Harness README', path: 'harness/README.md' },
  { id: 'scorecard', label: 'Triply scorecard', path: 'harness/scorecards/triply-scorecard.md' },
  { id: 'impl-template', label: 'Implementation prompt template', path: 'harness/templates/implementation-prompt.md' },
  { id: 'review-template', label: 'Review prompt template', path: 'harness/templates/review-prompt.md' },
] as const;

const REQUIRED_SPEC_FILES = [
  '00-product.md',
  '00-design-system.md',
  '01-auth-onboarding.md',
  '02-trips.md',
  '03-destinations-legs.md',
  '04-budget-expenses.md',
  '05-savings-plan.md',
  '06-itinerary.md',
  '07-reservations-checklists.md',
  '08-documents.md',
  '09-dashboard.md',
  '10-settings-preferences.md',
] as const;

function worst(checks: ReadinessCheck[]): CheckStatus {
  if (checks.some(c => c.status === 'fail')) return 'fail';
  if (checks.some(c => c.status === 'warn')) return 'warn';
  return 'ok';
}

export function evaluateReadiness(repoRoot: string): ReadinessReport {
  const checks: ReadinessCheck[] = [];

  // Check required files
  for (const required of REQUIRED_FILES) {
    const abs = join(repoRoot, required.path);
    const exists = existsSync(abs);
    checks.push({
      id: required.id,
      label: required.label,
      status: exists ? 'ok' : 'fail',
      detail: exists ? required.path : `${required.path} not found`,
    });
  }

  // Check spec files
  for (const specFile of REQUIRED_SPEC_FILES) {
    const abs = join(repoRoot, 'spec', specFile);
    const exists = existsSync(abs);
    checks.push({
      id: `spec-${specFile}`,
      label: `Spec: ${specFile}`,
      status: exists ? 'ok' : 'fail',
      detail: exists ? `spec/${specFile}` : `spec/${specFile} not found`,
    });
  }

  // Check package.json scripts
  const pkgPath = join(repoRoot, 'package.json');
  let scripts: Record<string, string> = {};
  if (existsSync(pkgPath)) {
    try {
      const pkg = readJson<{ scripts?: Record<string, string> }>(pkgPath);
      scripts = pkg.scripts ?? {};
    } catch {
      checks.push({
        id: 'package-json',
        label: 'package.json',
        status: 'fail',
        detail: 'failed to parse package.json',
      });
    }
  }

  for (const required of REQUIRED_SCRIPTS) {
    const present = typeof scripts[required.script] === 'string';
    checks.push({
      id: required.id,
      label: required.label,
      status: present ? 'ok' : 'fail',
      detail: present
        ? `npm run ${required.script}`
        : `missing script "${required.script}" in package.json`,
    });

    if (present) {
      const target = scriptTarget(scripts[required.script]);
      if (target) {
        const targetPath = join(repoRoot, target);
        const targetExists = existsSync(targetPath);
        checks.push({
          id: required.id + '-target',
          label: required.label + ' target',
          status: targetExists ? 'ok' : 'fail',
          detail: targetExists ? target : `${target} not found`,
        });
      }
    }
  }

  // Check project-state.json is valid
  const statePath = join(repoRoot, 'project-state.json');
  if (existsSync(statePath)) {
    try {
      const state = readJson<ProjectState>(statePath);
      const moduleCount = Object.keys(state.modules ?? {}).length;
      checks.push({
        id: 'project-state-valid',
        label: 'project-state.json is valid',
        status: moduleCount === 10 ? 'ok' : 'warn',
        detail: moduleCount === 10
          ? `${moduleCount} modules defined`
          : `expected 10 modules, found ${moduleCount}`,
      });
    } catch {
      checks.push({
        id: 'project-state-valid',
        label: 'project-state.json is valid',
        status: 'fail',
        detail: 'failed to parse project-state.json',
      });
    }
  }

  // Check node_modules exists
  const nodeModules = join(repoRoot, 'node_modules');
  const hasNodeModules = existsSync(nodeModules);
  checks.push({
    id: 'node-modules',
    label: 'node_modules installed',
    status: hasNodeModules ? 'ok' : 'fail',
    detail: hasNodeModules ? 'present' : 'run npm install first',
  });

  const overall = worst(checks);
  const go = overall !== 'fail';
  const hasWarnings = overall === 'warn';

  return {
    go,
    hasWarnings,
    checks,
    nextAction: overall === 'fail'
      ? 'NO-GO: resolve every FAIL above before running any module.'
      : overall === 'warn'
        ? 'GO with caution: review WARN items before running (harness/docs/product-run-checklist.md).'
        : 'GO: run npm run harness:start and follow harness/docs/product-run-checklist.md.',
  };
}

function scriptTarget(script: string): string | null {
  const match = script.match(/(?:^|\s)(harness\/scripts\/[^\s]+\.ts)(?:\s|$)/);
  return match?.[1] ?? null;
}

export function formatReadinessReport(report: ReadinessReport): string {
  const icon: Record<CheckStatus, string> = { ok: 'PASS', warn: 'WARN', fail: 'FAIL' };
  const lines = [
    'Triply Harness — Readiness Check',
    'Inspection only — no agents invoked.',
    '',
  ];

  for (const check of report.checks) {
    lines.push(`[${icon[check.status]}] ${check.label}: ${check.detail}`);
  }

  lines.push('');
  lines.push(`Result: ${report.go ? (report.hasWarnings ? 'GO (with warnings)' : 'GO') : 'NO-GO'}`);
  lines.push(`Next: ${report.nextAction}`);

  return lines.join('\n') + '\n';
}
