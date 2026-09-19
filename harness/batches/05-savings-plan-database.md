# Batch — Savings Plan — Database

## Status
pending

## Module
05-savings-plan

## Stage
database

## Agent
Agent Database

## Spec
spec/05-savings-plan.md

## Goal
Implement database schema, constraints, indexes and RLS required by Savings Plan.

## Context
Read the approved spec, `AGENTS.md`, accepted ADRs and `docs/implementation-plans/05-savings-plan.md` when it exists. Follow Triply's multi-destination, money/currency, timezone and privacy invariants where applicable.

## Allowed Files
- supabase/migrations/**
- src/types/savings.ts
- src/lib/validations/savings.ts

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
