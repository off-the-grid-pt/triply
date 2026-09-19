# Batch — Destinations & Travel Legs — Backend

## Status
pending

## Module
03-destinations-legs

## Stage
backend

## Agent
Agent Backend

## Spec
spec/03-destinations-legs.md

## Goal
Implement server-side behavior and contracts for Destinations & Travel Legs.

## Context
Read the approved spec, `AGENTS.md`, accepted ADRs and `docs/implementation-plans/03-destinations-legs.md` when it exists. Follow Triply's multi-destination, money/currency, timezone and privacy invariants where applicable.

## Allowed Files
- src/app/api/route/**
- src/server/route/**
- src/lib/api/route.ts
- src/lib/validations/route.ts
- src/types/route.ts

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
