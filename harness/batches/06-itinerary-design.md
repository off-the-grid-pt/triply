# Batch — Daily Itinerary — Design

## Status
pending

## Module
06-itinerary

## Stage
design

## Agent
Agent Design

## Spec
spec/06-itinerary.md

## Goal
Implement or document the approved UX/UI contract for Daily Itinerary, without changing business behavior.

## Context
Read the approved spec, `AGENTS.md`, accepted ADRs and `docs/implementation-plans/06-itinerary.md` when it exists. Follow Triply's multi-destination, money/currency, timezone and privacy invariants where applicable.

## Allowed Files
- design/06-itinerary.md
- src/features/itinerary/**

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
