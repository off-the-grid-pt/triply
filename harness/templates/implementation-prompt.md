# Implementation Prompt — Triply

## Agent
`<<agent>>`
## Module
`<<module>>`
## Stage
`<<architecture | design | database | backend | frontend | qa>>`
## Branch
`feat/<<module>>`
## Spec
`spec/<<module>>.md`

## Goal
<<bounded goal>>
## Context
<<dependencies, approved decisions, ADRs>>
## Allowed Files
<<exact paths>>
## Forbidden Files
- `spec/*.md`
- `CLAUDE.md`
- `AGENTS.md`
- `project-state.json`
- `harness/**`
- `.env.local`
- package manifests unless approved
## Validation
```bash
npx tsc --noEmit
npm run build
npm run test
npm run test:e2e
```
## Final report
Exactly: Summary / Files changed / Validation / Behavior changes / Risks & limitations / Next step.
