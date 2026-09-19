# Batch — Destinations & Travel Legs — Frontend

## Status
pending

## Module
03-destinations-legs

## Stage
frontend

## Agent
Agent Frontend

## Spec
spec/03-destinations-legs.md

## Goal
Implement the approved user-facing experience for Destinations & Travel Legs.

## Context
Read the approved spec, `AGENTS.md`, accepted ADRs and `docs/implementation-plans/03-destinations-legs.md` when it exists. Follow Triply's multi-destination, money/currency, timezone and privacy invariants where applicable.

## Allowed Files
- src/app/**/route/**
- src/features/route/**
- src/components/**
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
npm run test:e2e
```

## Expected Output
## Summary
## Files changed
## Validation
## Behavior changes
## Risks / limitations
## Next step
