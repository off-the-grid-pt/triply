# Triply Test Harness

The harness records bounded agent runs, validates scope and commands, scores results, and supports a maximum two-attempt repair loop. It is developer tooling and must not ship into runtime code.

## Stages
`architecture → design → database → backend → frontend → qa`

## Autonomous gate
A routine stage may advance when validation passes, scope is clean, score >= 90, QA/security blockers are absent, and no human-escalation condition exists.

## Suggested root scripts
```json
{
  "test:harness": "node --import tsx --test harness/tests/*.test.ts",
  "harness:typecheck": "tsc -p harness/tsconfig.json --noEmit",
  "harness:ready": "node --import tsx harness/scripts/ready.ts",
  "harness:start": "node --import tsx harness/scripts/start-run.ts",
  "harness:end": "node --import tsx harness/scripts/end-run.ts",
  "harness:score": "node --import tsx harness/scripts/score-run.ts",
  "harness:wizard": "node --import tsx harness/scripts/wizard.ts",
  "agent:run-batch": "node --import tsx harness/scripts/run-batch.ts",
  "agent:autopilot": "node --import tsx harness/scripts/autopilot.ts"
}
```

Dev tooling expected by the inherited harness includes TypeScript/tsx plus its existing CLI/logging dependencies. Install only after the Triply root package manifest is created and approved.
