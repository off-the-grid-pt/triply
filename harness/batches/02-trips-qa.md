# Batch — Trips — Qa

## Status
pending

## Module
02-trips

## Stage
qa

## Agent
Agent QA

## Spec
spec/02-trips.md

## Goal
Review and test Trips against the approved spec. Do not silently repair implementation.

## Context
Read the approved spec, `AGENTS.md`, accepted ADRs and `docs/implementation-plans/02-trips.md` when it exists. Follow Triply's multi-destination, money/currency, timezone and privacy invariants where applicable.

## Allowed Files
- e2e/trips.spec.ts
- src/features/trips/**/*.test.ts
- src/server/trips/**/*.test.ts

## Forbidden Files
- spec/*.md
- CLAUDE.md
- AGENTS.md
- project-state.json
- harness/**
- .env.local
- package.json
- package-lock.json

## Architecture Rules
- Follow `AGENTS.md` and accepted ADRs.
- Do not invent product behavior.
- Escalate when `CLAUDE.md` requires human approval.

## Validation Commands
```bash
npx tsc --noEmit
npm run build
npm run test
npm run test:e2e
```

## Expected Output
## Summary
## Files changed
## Validation
## Behavior changes
## Risks / limitations
## Next step
