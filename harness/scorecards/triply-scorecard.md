# Triply Harness Scorecard

Approval threshold: **90/100**. A validation failure or Critical/High security finding blocks approval regardless of score.

- Spec compliance: 35
- Domain/architecture compliance: 20
- Validation/tests: 20
- Scope discipline: 10
- Code/design quality: 10
- Security/privacy baseline: 5

## Hard failures
- Modified forbidden file.
- Behavior contradicts approved spec.
- Auth/RLS/privacy regression.
- Money calculation uses unsafe authoritative floating-point.
- Multi-destination model reduced to a single origin/destination model.
- Required validation failed.
