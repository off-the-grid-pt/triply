# AGENTS.md — Triply Engineering Constitution

Canonical instructions for every autonomous agent operating in this repository. Read before changing anything.

## 1. Project identity

Triply is a travel-planning web application for planning single- or multi-destination trips, estimating and tracking travel costs, savings, itinerary, reservations, checklists and travel documents.

Core product model: `Trip → ordered Stops + Travel Legs → plans/costs/reservations`. Never reduce this to `origin → destination`.

## 2. Baseline architecture

Until an ADR changes it, use:
- Next.js App Router + React + TypeScript strict.
- Supabase PostgreSQL, Auth and Storage.
- Tailwind CSS + shadcn/ui primitives.
- TanStack Query for client server-state where needed.
- react-hook-form + Zod for forms and validation.
- lucide-react as the icon set.
- Vitest for unit/integration tests and Playwright for E2E.
- npm as package manager.

Exact package versions are controlled by `package.json`/lockfile, not by this document.

## 3. Agent boundaries

- Product agent owns requirement proposals, not code.
- Architecture agent owns implementation plans and ADR proposals, not feature code.
- Design agent owns UX/UI design artifacts and design-system proposals.
- Database agent owns schema, migrations, policies and database tests.
- Backend agent owns server-side use-cases, API/actions, validation and integration boundaries.
- Frontend agent owns screens, components, forms and client interactions.
- QA agent reviews and tests; it does not silently repair implementation.
- Security agent audits; it does not silently change code.
- Orchestrator owns `project-state.json` and workflow progression.

## 4. Scope discipline

Every run must have explicit Allowed Files and Forbidden Files.
Do not touch files outside Allowed Files, even for cleanup.
Do not add/remove/update dependencies unless human-approved.
Do not change an approved spec during implementation.
Do not silently fix unrelated bugs. Report them.

## 5. TypeScript and code quality

- Strict TypeScript. No `any`, `@ts-ignore`, or `@ts-expect-error` without an approved exception.
- Thin route/page entry files. Business logic belongs in feature/server modules.
- Reuse domain types and validation schemas; do not duplicate business rules across layers.
- Prefer deterministic pure functions for financial calculations.
- Money must never use binary floating-point for persisted calculations. Store integer minor units or an approved decimal representation.
- All dates/times must define timezone semantics explicitly.

## 6. Travel domain invariants

- A trip has zero or more ordered stops while being drafted, and one or more stops when active.
- A stop represents a stay in a city/place over a date/time interval.
- A travel leg connects two stops or a trip boundary to a stop.
- Reordering stops must preserve route consistency or explicitly recalculate affected legs.
- Cross-border and multi-city routes are first-class.
- Costs can belong to the whole trip, a stop, a travel leg, an itinerary item or a reservation.
- Estimated, booked/committed, paid and actual values are distinct concepts.
- A budget can be tracked in the trip base currency while original transaction/reservation currency is retained.
- Currency conversion assumptions must be explicit and reproducible.

## 7. Data and security

- RLS is mandatory for user-owned Supabase tables.
- Every user-owned query must be scoped by authenticated user context.
- Auth tokens must never be stored in localStorage/sessionStorage.
- Service-role credentials never reach client code.
- Uploaded documents are private by default; access requires authenticated authorization.
- Do not log passports, IDs, auth tokens, payment details or document contents.
- Minimize stored sensitive travel-document metadata.

## 8. UX baseline

- UI language: Portuguese (Portugal), localization-ready.
- Responsive from mobile upward; travel planning must be usable on phone.
- Always include loading, empty, error and success states.
- Destructive actions require clear confirmation.
- Financial totals must display currency and distinguish estimate vs actual.
- Multi-destination route order must be visually understandable.
- Accessibility is part of acceptance criteria, not optional polish.

## 9. Tests

Every behavior change must have the smallest useful automated coverage. High-risk logic requires tests before stage approval:
- route ordering / leg consistency;
- budget totals;
- estimated vs actual comparison;
- currency normalization;
- savings calculations;
- authorization/RLS;
- document access.

Required baseline commands (when available):
```bash
npx tsc --noEmit
npm run build
npm run test
npm run test:e2e
npm run test:harness
```

A validation failure can never produce PASS.

## 10. Reporting format

Every implementation agent returns exactly:
```text
## Summary
## Files changed
## Validation
## Behavior changes
## Risks / limitations
## Next step
```

QA additionally reports spec compliance and a verdict: `APPROVED` or `REJECTED`.

## 11. Escalation

Stop and return control to the Orchestrator for any condition listed in `CLAUDE.md` under “Human approval is mandatory when”.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
