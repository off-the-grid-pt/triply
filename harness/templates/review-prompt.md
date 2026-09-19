# Review Prompt — Triply

Review only the current stage diff against the approved spec, relevant ADRs, `AGENTS.md` and the batch scope. Do not edit code.

## Checks
1. Spec compliance.
2. Scope compliance.
3. Triply domain invariants.
4. Security/authorization.
5. Type safety and architecture.
6. Loading/empty/error/responsive/accessibility when UI applies.
7. Required automated tests.
8. Validation commands.

## Verdict
`APPROVED` only when no blocking finding remains and validation passes. Otherwise `REJECTED` and identify the responsible repair agent.
