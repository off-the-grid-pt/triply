# Batch — Budget & Expenses — Database

## Status
pending

## Module
04-budget-expenses

## Stage
database

## Agent
Agent Database

## Spec
spec/04-budget-expenses.md

## Goal
Implement database schema, constraints, indexes and RLS required by Budget & Expenses.

## Context
Read the approved spec, `AGENTS.md`, accepted ADRs and `docs/implementation-plans/04-budget-expenses.md` when it exists. Follow Triply's multi-destination, money/currency, timezone and privacy invariants where applicable.

## Allowed Files
- supabase/migrations/**
- src/types/budget.ts
- src/lib/validations/budget.ts

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
