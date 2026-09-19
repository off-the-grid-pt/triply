# Batch — Trips — Backend

## Status
pending

## Module
02-trips

## Stage
backend

## Agent
Agent Backend

## Spec
spec/02-trips.md

## Goal
Implement server-side behavior and contracts for Trips.

## Context
Read the approved spec, `AGENTS.md`, accepted ADRs and `docs/implementation-plans/02-trips.md` when it exists. Follow Triply's multi-destination, money/currency, timezone and privacy invariants where applicable.

## Allowed Files
- src/app/api/trips/**
- src/server/trips/**
- src/lib/api/trips.ts
- src/lib/validations/trips.ts
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
```

## Expected Output
## Summary
## Files changed
## Validation
## Behavior changes
## Risks / limitations
## Next step
