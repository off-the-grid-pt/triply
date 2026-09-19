# Triply — Agent Orchestration Scaffold

This folder contains the initial orchestration system for developing **Triply**, a multi-destination travel planning platform focused on financial planning and trip organization.

The structure is derived from the Graninha orchestration model, but changes the workflow to be more autonomous, adds Product and Architecture responsibilities, introduces explicit escalation rules, and models Triply around trips containing many destinations and travel legs.

## Core workflow

```text
Product Spec (source of truth)
        ↓
Architecture → Design → Database → Backend → Frontend → QA
        ↓                                      ↓
   decision gate                         repair loop
        ↓                                      ↓
Security milestone / final audit → module done
```

Routine stages may auto-advance when all quality gates pass. Product, architecture, destructive data, dependency, security, external-provider, and production decisions require human approval.

## Main files

- `CLAUDE.md` — orchestrator contract.
- `AGENTS.md` — global engineering constitution.
- `project-state.json` — machine-readable state.
- `agents/` — specialized agent contracts.
- `spec/` — product and module specifications.
- `docs/adr/` — architecture decision records.
- `harness/` — execution, validation, scoring and run artifacts.

## Initial module order

1. Authentication & onboarding
2. Trips
3. Destinations & travel legs
4. Budget & expenses
5. Savings plan
6. Daily itinerary
7. Reservations & checklists
8. Documents
9. Dashboard
10. Settings & trip preferences

See `docs/ORCHESTRATION-DESIGN.md` for the rationale and the differences from Graninha.

## Autonomous runner

After the relevant module spec is explicitly marked `APPROVED`, the intended command is `npm run agent:autopilot`. It executes the current module through Codex, validation, scoring and up to two repair attempts per stage, then stops on any gate that needs a human decision.


## Current product gate

- `spec/00-product.md`: **APPROVED**
- `spec/01-auth-onboarding.md`: **REVIEW**
- Autonomous implementation remains blocked until Module 01 becomes `APPROVED`.

## Current phase — technical execution preparation

All MVP product specs (`00-product` and modules `01`–`10`) are approved. The accepted technical baseline is documented in `docs/TECHNICAL-ARCHITECTURE.md` and ADR-001..005. The execution cursor is `01-auth-onboarding / architecture`.

Before running feature implementation, complete `docs/implementation-plans/00-repository-bootstrap.md`. The orchestration package intentionally does not contain an installed Next.js application or secrets.

The pre-run harness audit is recorded in `docs/HARNESS-AUDIT.md`.

