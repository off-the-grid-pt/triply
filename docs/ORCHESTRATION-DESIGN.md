# Triply orchestration design — Graninha adaptation

## What was kept
- Spec-driven development.
- Specialized agents with strict scopes.
- Machine-readable project state.
- Per-run artifacts, validation, scoring, logs and repair.
- QA as an independent gate.
- ADRs for architecture decisions.

## What was changed

### 1. Autonomous progression
Graninha required human confirmation after every stage. Triply auto-advances routine stages when validation, scope and score gates pass. Human approval is reserved for material decisions.

### 2. Architecture stage
Triply adds an Architecture agent before Design/Database. Multi-destination routing, money, dates, currencies and private documents create cross-module constraints that should be decided before implementation.

### 3. Product agent outside the code loop
The Product agent creates or proposes specs. Implementation agents cannot mutate approved product behavior.

### 4. Repair loop
A failed QA/score result automatically returns to the responsible agent for up to two bounded repair attempts. Infinite agent loops are prohibited.

### 5. Security milestones
Security is not only an authentication-module concern. Triply stores travel plans and may store private documents, so security audits are required after Auth, after Documents, and before production release.

### 6. Better state model
Each stage stores run, score, validation and repair attempts rather than only `done/pending`.

### 7. Triply-specific domain invariant
The model is trip → ordered stops + travel legs. This prevents the architecture from accidentally assuming every trip is a simple return journey.

## Deliberately not copied
- Graninha-specific visual rules, colors, copy language and fonts.
- Finance-specific modules and business rules.
- Mandatory human approval after routine stages.
- A single security audit focused only on authentication.
- Hard-coded framework versions in agent contracts.

## Recommended operating mode
Use autonomous mode for implementation and review, with no automatic remote push/merge/deploy. Keep product/spec, destructive migration, security-model, dependency/vendor and production decisions under human control.
