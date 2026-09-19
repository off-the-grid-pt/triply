# Batch — Documents — Database

## Status
pending

## Module
08-documents

## Stage
database

## Agent
Agent Database

## Spec
spec/08-documents.md

## Goal
Implement database schema, constraints, indexes and RLS required by Documents.

## Context
Read the approved spec, `AGENTS.md`, accepted ADRs and `docs/implementation-plans/08-documents.md` when it exists. Follow Triply's multi-destination, money/currency, timezone and privacy invariants where applicable.

## Allowed Files
- supabase/migrations/**
- src/types/documents.ts
- src/lib/validations/documents.ts

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
