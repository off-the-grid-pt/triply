# Analysis of the Graninha orchestration used for Triply

## Graninha assets reviewed
- Root orchestrator and engineering contract.
- Specialized Design, Database, Backend, Frontend, QA and Security prompts.
- 12 module specs and design system.
- `project-state.json` and human-readable agent board.
- ADRs for stack, SDD, tests and financial behavior.
- Harness TypeScript library, scripts, templates, batches, scorecards, logs and tests.
- Example module batches and implementation/review prompt templates.

## Strengths retained
The Graninha project has excellent scope isolation, spec-first discipline, explicit allowed/forbidden files, independent QA, run artifacts, validation and machine-readable state. These are retained.

## Weaknesses corrected
Graninha requires approval after every stage, has no explicit architecture agent, duplicates some rules across prompts, and its project state does not carry enough run/repair metadata. Triply reduces routine human intervention and adds architecture/product/security gates.

## Important note
The Triply module specs in this scaffold are intentionally DRAFT skeletons because detailed business rules, error cases and flows have not yet been fully defined with the product owner. Autonomous coding is blocked until the relevant spec is approved. This prevents agents from inventing the product.
