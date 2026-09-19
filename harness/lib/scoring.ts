// scoring.ts — pure scoring logic for Triply harness runs.
//
// Deterministic, side-effect free.
// Scorecard mirrors harness/scorecards/triply-scorecard.md.
// Tested in harness/tests/scoring.test.ts.

import type { RunVerdict, ValidationStepStatus } from './types';

// Score thresholds
export const SCORE_APPROVED = 90;   // at or above: APPROVED
export const SCORE_FLOOR = 60;      // 60-89: NEEDS_CHANGES (may repair)
                                    // below 60: REJECTED (hard failure)

interface DeductionDef {
  points: number;
  label: string;
}

const DEDUCTIONS = Object.freeze({
  // Spec compliance (max 40 points)
  regraNegocioViolation: { points: 20, label: 'spec Regra de Negócio not implemented correctly' },
  casoErroWrongMessage: { points: 10, label: 'spec Caso de Erro returns wrong message' },
  fluxoIncomplete: { points: 10, label: 'spec Fluxo not implemented completely' },

  // Design system (max 20 points)
  hardcodedColor: { points: 10, label: 'hardcoded color value found in code' },
  wrongGradientDirection: { points: 5, label: 'metallic gradient uses 180deg instead of 90deg' },
  glassOnList: { points: 5, label: 'glassmorphism applied to list or table' },
  wrongIcon: { points: 5, label: 'icon library other than lucide-react used' },
  ptPtText: { points: 5, label: 'Portuguese from Portugal text found in UI' },

  // Validation (max 20 points)
  missingValidation: { points: 20, label: 'validation did not run completely' },
  tscFail: { points: 10, label: 'TypeScript check failed (tsc --noEmit)' },
  buildFail: { points: 10, label: 'Next.js build failed (npm run build)' },
  testFail: { points: 5, label: 'Vitest tests failed (npm run test)' },
  e2eFail: { points: 5, label: 'Playwright E2E tests failed (npm run test:e2e)' },

  // Code quality (max 20 points)
  anyTypeUsed: { points: 10, label: 'TypeScript `any` type used' },
  forbiddenFiles: { points: 15, label: 'files outside allowed scope were modified' },
  packageJsonChanged: { points: 10, label: 'package.json modified without approval' },
  envLocalChanged: { points: 20, label: '.env.local modified — credentials at risk' },
  missingStates: { points: 5, label: 'loading, error or empty state missing from component' },
  missingOutputFormat: { points: 5, label: 'output format does not follow AGENTS.md Section 11' },
} satisfies Record<string, DeductionDef>);

type DeductionKey = keyof typeof DEDUCTIONS;

export interface Deduction {
  key: DeductionKey;
  points: number;
  label: string;
  detail?: string;
}

export interface ScoreFlags {
  // Spec compliance
  regraNegocioViolation?: boolean;
  casoErroWrongMessage?: boolean;
  fluxoIncomplete?: boolean;

  // Design system
  hardcodedColor?: boolean;
  wrongGradientDirection?: boolean;
  glassOnList?: boolean;
  wrongIcon?: boolean;
  ptPtText?: boolean;

  // Code quality
  missingValidation?: boolean;
  scopeViolation?: boolean;
  anyTypeUsed?: boolean;
  forbiddenFiles?: boolean;
  packageJsonChanged?: boolean;
  envLocalChanged?: boolean;
  missingStates?: boolean;
  missingOutputFormat?: boolean;
}

export interface ValidationSteps {
  tsc?: ValidationStepStatus | null;
  build?: ValidationStepStatus | null;
  test?: ValidationStepStatus | null;
  test_e2e?: ValidationStepStatus | null;
}

export interface ScoreInput {
  validation?: ValidationSteps;
  flags?: ScoreFlags;
}

export interface ScoreResult {
  score: number;
  verdict: RunVerdict;
  deductions: Deduction[];
  totalDeduction: number;
}

export function getVerdict(score: number): RunVerdict {
  if (score >= SCORE_APPROVED) return 'APPROVED';
  if (score >= SCORE_FLOOR) return 'NEEDS_CHANGES';
  return 'REJECTED';
}

export function calculateScore(input: ScoreInput = {}): ScoreResult {
  const { validation = {}, flags = {} } = input;
  const deductions: Deduction[] = [];

  const apply = (key: DeductionKey, detail?: string): void => {
    const def = DEDUCTIONS[key];
    deductions.push({ key, points: def.points, label: def.label, ...(detail ? { detail } : {}) });
  };

  // Spec compliance
  if (flags.regraNegocioViolation) apply('regraNegocioViolation');
  if (flags.casoErroWrongMessage) apply('casoErroWrongMessage');
  if (flags.fluxoIncomplete) apply('fluxoIncomplete');

  // Design system
  if (flags.hardcodedColor) apply('hardcodedColor');
  if (flags.wrongGradientDirection) apply('wrongGradientDirection');
  if (flags.glassOnList) apply('glassOnList');
  if (flags.wrongIcon) apply('wrongIcon');
  if (flags.ptPtText) apply('ptPtText');

  // Validation
  if (flags.missingValidation) apply('missingValidation');
  if (validation.tsc === 'fail') apply('tscFail');
  if (validation.build === 'fail') apply('buildFail');
  if (validation.test === 'fail') apply('testFail');
  if (validation.test_e2e === 'fail') apply('e2eFail');

  // Code quality
  if (flags.anyTypeUsed) apply('anyTypeUsed');
  if (flags.scopeViolation || flags.forbiddenFiles) apply('forbiddenFiles');
  if (flags.packageJsonChanged) apply('packageJsonChanged');
  if (flags.envLocalChanged) apply('envLocalChanged');
  if (flags.missingStates) apply('missingStates');
  if (flags.missingOutputFormat) apply('missingOutputFormat');

  const totalDeduction = deductions.reduce((sum, d) => sum + d.points, 0);
  const score = Math.max(0, 100 - totalDeduction);
  const verdict = getVerdict(score);

  return { score, verdict, deductions, totalDeduction };
}

export interface RepairDecisionInput {
  verdict: RunVerdict;
  score?: number | null;
}

export function shouldAttemptRepair(result: RepairDecisionInput): boolean {
  if (result.verdict === 'APPROVED') return false;
  if (result.verdict === 'REJECTED') return true;
  if (result.verdict === 'NEEDS_CHANGES') return true;
  return false;
}

export function summarizeScore(result: ScoreResult): string {
  const lines: string[] = [
    `Score: ${result.score} / 100`,
    `Verdict: ${result.verdict}`,
    '',
  ];

  if (result.deductions.length === 0) {
    lines.push('No deductions — perfect score.');
  } else {
    lines.push('Deductions:');
    for (const d of result.deductions) {
      const detail = d.detail ? ` — ${d.detail}` : '';
      lines.push(`  -${d.points}  ${d.label}${detail}`);
    }
  }

  lines.push('');
  if (result.verdict === 'APPROVED') {
    lines.push('APPROVED — module stage can advance to commit.');
  } else if (result.verdict === 'NEEDS_CHANGES') {
    lines.push('NEEDS_CHANGES — repair required before advancing.');
  } else {
    lines.push('REJECTED — hard failure, repair required.');
  }

  return lines.join('\n') + '\n';
}
