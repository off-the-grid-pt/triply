# Batch — Daily Itinerary — Database

## Status
pending

## Module
06-itinerary

## Stage
database

## Agent
Agent Database

## Spec
spec/06-itinerary.md

## Goal
Implement database schema, constraints, indexes and RLS required by Daily Itinerary.

## Context
Read the approved spec, `AGENTS.md`, accepted ADRs and `docs/implementation-plans/06-itinerary.md` when it exists. Follow Triply's multi-destination, money/currency, timezone and privacy invariants where applicable.

## Allowed Files
- supabase/migrations/**
- src/types/itinerary.ts
- src/lib/validations/itinerary.ts

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
npm run test
```

## Expected Output
## Summary
## Files changed
## Validation
## Behavior changes
## Risks / limitations
## Next step
