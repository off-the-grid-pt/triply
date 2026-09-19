# Batch — Reservations & Checklists — Backend

## Status
pending

## Module
07-reservations-checklists

## Stage
backend

## Agent
Agent Backend

## Spec
spec/07-reservations-checklists.md

## Goal
Implement server-side behavior and contracts for Reservations & Checklists.

## Context
Read the approved spec, `AGENTS.md`, accepted ADRs and `docs/implementation-plans/07-reservations-checklists.md` when it exists. Follow Triply's multi-destination, money/currency, timezone and privacy invariants where applicable.

## Allowed Files
- src/app/api/reservations/**
- src/server/reservations/**
- src/lib/api/reservations.ts
- src/lib/validations/reservations.ts
- src/types/reservations.ts

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
