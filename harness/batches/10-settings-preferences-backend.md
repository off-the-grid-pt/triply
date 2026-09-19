# Batch — Settings & Trip Preferences — Backend

## Status
pending

## Module
10-settings-preferences

## Stage
backend

## Agent
Agent Backend

## Spec
spec/10-settings-preferences.md

## Goal
Implement server-side behavior and contracts for Settings & Trip Preferences.

## Context
Read the approved spec, `AGENTS.md`, accepted ADRs and `docs/implementation-plans/10-settings-preferences.md` when it exists. Follow Triply's multi-destination, money/currency, timezone and privacy invariants where applicable.

## Allowed Files
- src/app/api/settings/**
- src/server/settings/**
- src/lib/api/settings.ts
- src/lib/validations/settings.ts
- src/types/settings.ts

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
