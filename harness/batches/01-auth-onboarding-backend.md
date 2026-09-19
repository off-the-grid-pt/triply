# Batch — Authentication & Onboarding — Backend

## Status
pending

## Module
01-auth-onboarding

## Stage
backend

## Agent
Agent Backend

## Spec
spec/01-auth-onboarding.md

## Goal
Implement server-side behavior and contracts for Authentication & Onboarding.

## Context
Read the approved spec, `AGENTS.md`, accepted ADRs and `docs/implementation-plans/01-auth-onboarding.md` when it exists. Follow Triply's multi-destination, money/currency, timezone and privacy invariants where applicable.

## Allowed Files
- src/app/api/auth/**
- src/server/auth/**
- src/lib/api/auth.ts
- src/lib/validations/auth.ts
- src/types/auth.ts

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
