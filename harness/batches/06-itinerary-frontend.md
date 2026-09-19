# Batch — Daily Itinerary — Frontend

## Status
pending

## Module
06-itinerary

## Stage
frontend

## Agent
Agent Frontend

## Spec
spec/06-itinerary.md

## Goal
Implement the approved user-facing experience for Daily Itinerary.

## Context
Read the approved spec, `AGENTS.md`, accepted ADRs and `docs/implementation-plans/06-itinerary.md` when it exists. Follow Triply's multi-destination, money/currency, timezone and privacy invariants where applicable.

## Allowed Files
- src/app/**/itinerary/**
- src/features/itinerary/**
- src/components/**
- src/types/itinerary.ts

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
