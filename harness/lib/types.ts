// harness/lib/types.ts
// Domain contracts for the Triply harness.
// Pure types — no I/O, no side effects, safe to import anywhere.

// ─── Module & Stage ──────────────────────────────────────────────────────────

export type ModuleId =
  | '01-auth-onboarding'
  | '02-trips'
  | '03-destinations-legs'
  | '04-budget-expenses'
  | '05-savings-plan'
  | '06-itinerary'
  | '07-reservations-checklists'
  | '08-documents'
  | '09-dashboard'
  | '10-settings-preferences';

export type Stage =
  | 'architecture'
  | 'design'
  | 'database'
  | 'backend'
  | 'frontend'
  | 'qa';

export type StageStatus =
  | 'pending'    // not started
  | 'done'       // completed in the current project-state.json format
  | 'doing'      // in progress
  | 'review'     // waiting for human approval
  | 'approved'   // human approved
  | 'rejected'   // rejected — needs repair
  | 'skipped';   // stage does not apply, with recorded reason

export type ModuleStatus =
  | 'pending'    // no stage started
  | 'in_progress' // at least one stage doing
  | 'complete';  // all stages approved + committed

// ─── Run ─────────────────────────────────────────────────────────────────────

export type RunStatus =
  | 'created'       // run folder created
  | 'prompt_ready'  // prompt written to prompt.md
  | 'agent_done'    // agent finished, result pasted to result.md
  | 'validated'     // validation commands completed
  | 'scored'        // scorecard applied
  | 'approved'      // human approved
  | 'rejected'      // human rejected
  | 'repaired'      // agent completed repair attempt
  | 'committed';    // git commit done

export type RunVerdict =
  | 'APPROVED'        // all checks passed
  | 'REJECTED'        // one or more checks failed
  | 'NEEDS_CHANGES'   // passed validation but score below threshold
  | 'IN_PROGRESS';    // not yet scored

// ─── Validation ──────────────────────────────────────────────────────────────

export type ValidationStepKey =
  | 'tsc'
  | 'build'
  | 'test'
  | 'test_e2e'
  | 'harness_typecheck';

export type ValidationStepStatus =
  | 'pass'
  | 'fail'
  | 'skipped';

export interface ValidationStepResult {
  key: ValidationStepKey;
  label: string;
  command: string;
  status: ValidationStepStatus;
  exitCode: number | null;
  output: string;
}

export interface ValidationResult {
  ok: boolean;
  steps: ValidationStepResult[];
  failed: ValidationStepKey[];
  log: string;
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

// Score thresholds — aligned with Aurea's run-policy.ts
export const SCORE_FLOOR = 60;       // below this: hard failure, no repair
export const SCORE_THRESHOLD = 90;   // at or above this: approved

export interface ScoreBreakdown {
  spec_compliance: number | null;     // 0-40 points
  design_system: number | null;       // 0-20 points
  validation: number | null;          // 0-20 points
  code_quality: number | null;        // 0-20 points
  total: number | null;               // 0-100 points
}

export interface ScoreResult {
  verdict: RunVerdict;
  score: number | null;
  breakdown: ScoreBreakdown;
  deductions: string[];               // list of what caused deductions
  notes: string[];                    // additional observations
}

// ─── Run Artifacts ───────────────────────────────────────────────────────────

export interface RunMetrics {
  module: ModuleId;
  stage: Stage;
  agent: string;
  branch: string;
  status: RunStatus;
  verdict: RunVerdict;
  startedAt: string;                  // ISO datetime
  endedAt: string | null;
  durationSeconds: number | null;
  score: number | null;
  filesChanged: string[];
  validation: {
    tsc: ValidationStepStatus | null;
    build: ValidationStepStatus | null;
    test: ValidationStepStatus | null;
    test_e2e: ValidationStepStatus | null;
  };
  specCompliance: {
    regraNegocio: ValidationStepStatus | null;
    casosErro: ValidationStepStatus | null;
    fluxos: ValidationStepStatus | null;
    designSystem: ValidationStepStatus | null;
  };
}

// ─── Agent Failure Classification ────────────────────────────────────────────
// Adapted from Aurea's agent-failure.ts — pure string inspection, no I/O.

export type AgentFailureKind =
  | 'none'            // success
  | 'quota_exceeded'  // out of credits — cannot repair
  | 'auth_error'      // not logged in — cannot repair
  | 'agent_failed'    // generic failure — may repair
  | 'spec_violation'  // implemented against spec — must repair
  | 'design_violation'; // violated design system — must repair

export interface AgentFailureClassification {
  kind: AgentFailureKind;
  reason: string | null;
}

// Failures that re-running the same agent cannot fix.
export function isUnrepairable(kind: AgentFailureKind): boolean {
  return kind === 'quota_exceeded' || kind === 'auth_error';
}

// Whether a run needs a repair attempt.
export function needsRepair(
  verdict: RunVerdict,
  score: number | null,
  threshold: number = SCORE_THRESHOLD
): boolean {
  if (verdict === 'APPROVED') return false;
  if (verdict === 'REJECTED') return true;
  if (verdict === 'NEEDS_CHANGES') return true;
  if (score !== null && score >= SCORE_FLOOR && score < threshold) return true;
  return false;
}

// ─── Project State ───────────────────────────────────────────────────────────

export interface StageState {
  status: StageStatus;
  runDir: string | null;      // path to the run folder, if started
  score?: number | null;
  validation?: unknown | null;
  repairAttempts?: number;
  approvedAt: string | null;  // ISO datetime when approved
  notes: string | null;
}

export type ProjectStageStatus = StageStatus | 'done';

export type ProjectStageMap =
  | Record<Stage, ProjectStageStatus>
  | Record<Stage, StageState>;

export interface ModuleState {
  name: string;
  spec: string;
  status: ModuleStatus | 'done';
  stages: ProjectStageMap;
  qa_approved_at?: string;
  design_approved_at?: string;
  commit?: string;
}

export interface ProjectState {
  project: string;
  version: string;
  last_updated?: string;
  lastUpdated?: string;
  currentModule?: string | number;
  current_module?: string | number;
  currentStage?: Stage;
  current_stage?: Stage;
  status?: string;
  modules: Record<string, ModuleState>;
  decisions_log?: Array<Record<string, unknown>>;
  decisionsLog?: Array<{
    date: string;
    decision: string;
    reason: string;
  }>;
  git_log?: Array<Record<string, unknown>>;
  gitLog?: Array<{
    date: string;
    commit: string;
    module: string;
  }>;
}
