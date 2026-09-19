# Batch — Trips — Design

## Status
pending

## Module
02-trips

## Stage
design

## Agent
Agent Design

## Spec
spec/02-trips.md

## Goal
Implement or document the approved UX/UI contract for Trips, without changing business behavior.

## Context
Read the approved spec, `AGENTS.md`, accepted ADRs and `docs/implementation-plans/02-trips.md` when it exists. Follow Triply's multi-destination, money/currency, timezone and privacy invariants where applicable.

## Allowed Files
- design/02-trips.md
- src/features/trips/**

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
```

## Expected Output
## Summary
## Files changed
## Validation
## Behavior changes
## Risks / limitations
## Next step
