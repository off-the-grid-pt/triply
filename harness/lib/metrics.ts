// metrics.ts — pure functions that build and update the RunMetrics object.
//
// The metrics object is a JSON-serializable record of one harness run.
// Written to harness/runs/<run-dir>/metrics.json after each stage.

import type {
  ModuleId,
  RunMetrics,
  RunStatus,
  RunVerdict,
  ScoreBreakdown,
  Stage,
  ValidationStepStatus,
} from './types';

export interface CreateMetricsInput {
  module: ModuleId;
  stage: Stage;
  agent: string;
  branch: string;
  startedAt?: string;
}

export function createMetrics({
  module,
  stage,
  agent,
  branch,
  startedAt = new Date().toISOString(),
}: CreateMetricsInput): RunMetrics {
  return {
    module,
    stage,
    agent,
    branch,
    status: 'created',
    verdict: 'IN_PROGRESS',
    startedAt,
    endedAt: null,
    durationSeconds: null,
    score: null,
    filesChanged: [],
    validation: {
      tsc: null,
      build: null,
      test: null,
      test_e2e: null,
    },
    specCompliance: {
      regraNegocio: null,
      casosErro: null,
      fluxos: null,
      designSystem: null,
    },
  };
}

function applyDuration(metrics: RunMetrics, endedAt: string): void {
  const start = Date.parse(metrics.startedAt);
  const end = Date.parse(endedAt);
  if (!Number.isNaN(start) && !Number.isNaN(end)) {
    metrics.durationSeconds = Math.max(0, Math.round((end - start) / 1000));
  }
}

export function markStatus(metrics: RunMetrics, status: RunStatus): RunMetrics {
  metrics.status = status;
  return metrics;
}

export function markCompleted(
  metrics: RunMetrics,
  {
    endedAt = new Date().toISOString(),
    filesChanged = [],
  }: { endedAt?: string; filesChanged?: string[] } = {}
): RunMetrics {
  metrics.endedAt = endedAt;
  metrics.status = 'agent_done';
  metrics.filesChanged = filesChanged;
  applyDuration(metrics, endedAt);
  return metrics;
}

export function setValidationResult(
  metrics: RunMetrics,
  partial: Partial<RunMetrics['validation']>
): RunMetrics {
  metrics.validation = { ...metrics.validation, ...partial };
  metrics.status = 'validated';
  return metrics;
}

export function setSpecCompliance(
  metrics: RunMetrics,
  partial: Partial<RunMetrics['specCompliance']>
): RunMetrics {
  metrics.specCompliance = { ...metrics.specCompliance, ...partial };
  return metrics;
}

export interface SetScoreInput {
  score: number;
  verdict: RunVerdict;
  breakdown?: Partial<ScoreBreakdown>;
}

export function setScoreResult(
  metrics: RunMetrics,
  { score, verdict, breakdown = {} }: SetScoreInput
): RunMetrics {
  metrics.score = score;
  metrics.verdict = verdict;
  metrics.status = 'scored';
  return metrics;
}

export function markApproved(
  metrics: RunMetrics,
  { endedAt = new Date().toISOString() }: { endedAt?: string } = {}
): RunMetrics {
  metrics.verdict = 'APPROVED';
  metrics.status = 'approved';
  metrics.endedAt = endedAt;
  applyDuration(metrics, endedAt);
  return metrics;
}

export function markRejected(
  metrics: RunMetrics,
  { endedAt = new Date().toISOString() }: { endedAt?: string } = {}
): RunMetrics {
  metrics.verdict = 'REJECTED';
  metrics.status = 'rejected';
  metrics.endedAt = endedAt;
  applyDuration(metrics, endedAt);
  return metrics;
}

// Validation passed but score below threshold — repair needed
export function markNeedsChanges(metrics: RunMetrics): RunMetrics {
  metrics.verdict = 'NEEDS_CHANGES';
  return metrics;
}

// Check if all validation steps passed
export function validationPassed(metrics: RunMetrics): boolean {
  const v = metrics.validation;
  return (
    v.tsc === 'pass' &&
    v.build === 'pass' &&
    (v.test === 'pass' || v.test === 'skipped') &&
    (v.test_e2e === 'pass' || v.test_e2e === 'skipped')
  );
}
