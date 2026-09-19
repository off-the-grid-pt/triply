# Batch — Dashboard — Backend

## Status
pending

## Module
09-dashboard

## Stage
backend

## Agent
Agent Backend

## Spec
spec/09-dashboard.md

## Goal
Implement server-side behavior and contracts for Dashboard.

## Context
Read the approved spec, `AGENTS.md`, accepted ADRs and `docs/implementation-plans/09-dashboard.md` when it exists. Follow Triply's multi-destination, money/currency, timezone and privacy invariants where applicable.

## Allowed Files
- src/app/api/dashboard/**
- src/server/dashboard/**
- src/lib/api/dashboard.ts
- src/lib/validations/dashboard.ts
- src/types/dashboard.ts

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
