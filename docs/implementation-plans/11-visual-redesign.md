# Triply visual redesign
Owner request: adapt the supplied Notion dark design system, apply it throughout Triply, then refine page layouts using 21st.dev references.

## Scope
Allowed Files: `app/globals.css`, `app/layout.tsx`, `app/**/page.tsx`, `app/**/loading.tsx`, `app/**/error.tsx`, `app/**/not-found.tsx`, `app/(app)/layout.tsx`, `components/shared/*.tsx`, `components/ui/*.tsx`, `features/**/components/*.tsx`, `features/auth/*form.tsx`, `tests/e2e/design-system.spec.ts`, `tests/unit/design-system.test.ts`, `spec/00-design-system.md` (previously draft), this plan. Orchestrator only: append a decision/visual work record to `project-state.json`.
Forbidden Files: all actions, queries, schemas, domain calculations/types, Supabase files, middleware/proxy, secrets/configuration, dependencies and lockfile, harness implementation, approved functional specs, all other files. Generated build/test artifacts are produced by required validation tools.

## Implementation
Validation scope extension: `playwright.config.ts` may align the dev server hostname with its existing 127.0.0.1 base URL. This avoids the Next.js 16.3 dev-origin asset block without changing application security or exposing additional origins.

1. Verify reference dark tokens and preserve provenance in the design system document.
2. Define semantic CSS utilities and migrate presentation colors, radius and focus.
3. Add a presentational shell around the existing server authentication gate, preserving its guards.
4. Refine trips, trip dashboard, finance, savings and timeline hierarchy; update all remaining pages/forms to common tokens.
5. Provide a public synthetic component catalogue and responsive E2E coverage.
6. Validate typecheck, build, units, E2E, harness and visual desktop/mobile rendering. No private-route auth bypass, dependency addition or deployment.

## Known baseline constraints
- Workspace contains no Git repository; changes cannot be reviewed with git diff.
- Project state still describes bootstrap stages despite existing feature implementation; do not mark those modules complete during visual work.
- 21st.dev CLI returned HTTP 401; the existing Cursor MCP connection succeeded on 2026-09-07 and supplied the reviewed visual references documented in the design system.
- No icon dependency is installed; use textual navigation and a simple CSS brand mark.

## Build compatibility repair
The production validator rejected exported Shell helpers in page entry files. Moved those unchanged presentation wrappers into finance/itinerary/planning `components/form-shell.tsx` and updated their existing consumers. No form, query or action behavior changed.

## Final validation — 2026-09-07
- npx tsc --noEmit: PASS.
- npm run build: PASS; all existing routes and public /design-system generated.
- npm run test: PASS, 126 tests across 21 files (including contrast and contextual navigation coverage).
- npm run test:e2e: PASS, 7 tests; screenshots and checks at 375, 768 and 1440px, keyboard focus, mobile disclosure, disabled controls, example form feedback, landing and sign-in.
- npm run test:harness: PASS, 86 tests.
- npm run lint: PASS, 0 errors; 14 existing warnings in unchanged server/domain files.
- Actual 21st.dev MCP searches and four preview images reviewed; provenance and specific adaptations in design-system document.
- Private authentication/ownership gates preserved; no live authenticated E2E account was used. The catalogue renders real TripCard and TripDashboard against clearly identified synthetic data.
- No deployment, dependency installation, schema or domain calculation change.

The initial build exposed invalid page-level Shell exports; extracted wrappers fixed the build. Initial E2E form feedback failed because Next development assets were blocked when the server hostname differed from the test base URL. Matching the server hostname fixed the complete E2E suite without changing form behavior or application security.
