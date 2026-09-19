# ADR-001 — Baseline application stack
Status: accepted
Date: 2026-09-01

## Context
Triply needs a full-stack web architecture suitable for a small team using autonomous coding agents, authenticated user data, relational travel data, private files and rapid deployment.

## Decision
Use the following baseline stack for the MVP:
- Next.js App Router + React + strict TypeScript.
- Supabase for PostgreSQL, Authentication and private Storage.
- `@supabase/ssr` for cookie-based SSR authentication in Next.js.
- Tailwind CSS + shadcn/ui primitives.
- Zod + react-hook-form for form/input validation.
- TanStack Query only where client-side server-state caching materially improves UX; server-first data access remains the default.
- Vitest for unit/integration tests and Playwright for E2E.
- npm with a committed lockfile.

Exact package versions are pinned by `package.json`/`package-lock.json` during bootstrap. Agents must not independently upgrade packages.

## Consequences
- The initial dependency set above is architecture-approved for repository bootstrap.
- Any dependency outside this set still requires the human dependency gate in `CLAUDE.md`.
- Authenticated pages must not use ISR where session refresh can occur.
- Domain/data access should be server-first unless a spec or accepted ADR justifies client-side access.
