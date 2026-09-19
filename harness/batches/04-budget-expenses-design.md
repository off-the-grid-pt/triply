# Batch — Budget & Expenses — Design

## Status
pending

## Module
04-budget-expenses

## Stage
design

## Agent
Agent Design

## Spec
spec/04-budget-expenses.md

## Goal
Implement or document the approved UX/UI contract for Budget & Expenses, without changing business behavior.

## Context
Read the approved spec, `AGENTS.md`, accepted ADRs and `docs/implementation-plans/04-budget-expenses.md` when it exists. Follow Triply's multi-destination, money/currency, timezone and privacy invariants where applicable.

## Allowed Files
- design/04-budget-expenses.md
- src/features/budget/**

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
