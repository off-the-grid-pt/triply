# Batch — Trips — Frontend

## Status
pending

## Module
02-trips

## Stage
frontend

## Agent
Agent Frontend

## Spec
spec/02-trips.md

## Goal
Implement the approved user-facing experience for Trips.

## Context
Read the approved spec, `AGENTS.md`, accepted ADRs and `docs/implementation-plans/02-trips.md` when it exists. Follow Triply's multi-destination, money/currency, timezone and privacy invariants where applicable.

## Allowed Files
- src/app/**/trips/**
- src/features/trips/**
- src/components/**
- src/types/trips.ts

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
