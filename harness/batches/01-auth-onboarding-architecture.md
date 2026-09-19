# Batch — Authentication & Onboarding — Architecture

## Status
pending

## Module
01-auth-onboarding

## Stage
architecture

## Agent
Agent Architecture

## Spec
spec/01-auth-onboarding.md

## Goal
Produce an implementation plan for Authentication & Onboarding. No feature code.

## Context
Read the approved spec, `AGENTS.md`, accepted ADRs and `docs/implementation-plans/01-auth-onboarding.md` when it exists. Follow Triply's multi-destination, money/currency, timezone and privacy invariants where applicable.

## Allowed Files
- docs/implementation-plans/01-auth-onboarding.md
- docs/adr/ADR-*.md

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
npm run harness:typecheck
```

## Expected Output
## Summary
## Files changed
## Validation
## Behavior changes
## Risks / limitations
## Next step
