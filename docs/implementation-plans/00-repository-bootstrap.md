# Implementation Plan — 00 Repository Bootstrap
Status: READY — infrastructure prerequisite
Date: 2026-09-01

## Purpose
Create the minimum executable Triply application shell required before autonomous feature stages can run. This is infrastructure bootstrap, not a product module.

## Approved baseline
Use ADR-001 and ADR-005. No dependencies outside the accepted baseline may be introduced without the dependency gate.

## Required outputs
- Next.js App Router application at repository root.
- strict TypeScript configuration.
- Tailwind CSS baseline.
- shadcn/ui-compatible component setup.
- Supabase browser/server SSR utilities.
- `.env.example` with non-secret variable names only.
- npm lockfile.
- Vitest configuration and one smoke test.
- Playwright configuration and one smoke E2E test.
- harness scripts wired into root `package.json`.
- Supabase local/migration folder structure.
- CI-safe commands for typecheck/build/unit/E2E/harness tests.

## Required npm scripts
```json
{
  "dev": "next dev",
  "build": "next build",
  "test": "vitest run",
  "test:e2e": "playwright test",
  "test:harness": "vitest run harness/tests",
  "harness:typecheck": "tsc -p harness/tsconfig.json --noEmit",
  "harness:ready": "node --import tsx harness/scripts/ready.ts",
  "harness:start": "node --import tsx harness/scripts/start-run.ts",
  "harness:end": "node --import tsx harness/scripts/end-run.ts",
  "harness:score": "node --import tsx harness/scripts/score-run.ts",
  "agent:run-batch": "node --import tsx harness/scripts/run-batch.ts",
  "agent:autopilot": "node --import tsx harness/scripts/autopilot.ts"
}
```

Exact package versions are selected/pinned at bootstrap time and committed.

## Environment contract
`.env.example` should declare only names, never values:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Server-only secret/service keys are not required for normal Module 01 application flows. If later infrastructure requires one, it must be explicitly gated and never exposed with `NEXT_PUBLIC_`.

## Supabase baseline
- local development strategy documented;
- migrations live under `supabase/migrations/`;
- all exposed application tables use RLS;
- private document bucket is created only with Module 08 or an approved earlier infrastructure migration.

## Bootstrap validation
The bootstrap is complete only when:
```bash
npx tsc --noEmit
npm run build
npm run test
npm run test:harness
npm run harness:typecheck
npm run harness:ready
```
pass, except `harness:ready` may still report environment-specific warnings that are explicitly documented.

## Not included
- auth feature implementation;
- profile table;
- Triply visual branding;
- product screens;
- production deployment;
- Supabase production project creation.
