# Optional email confirmation
Owner-authorized scope: remove mandatory email confirmation from login and signup while preserving genuine Supabase sessions, passwords, onboarding and RLS.

Allowed Files: features/auth/actions.ts, features/auth/verify-form.tsx (remove obsolete resend UI), app/(app)/layout.tsx, app/onboarding/page.tsx, app/(public)/auth/verify/page.tsx, app/(public)/auth/sign-in/page.tsx, spec/01-auth-onboarding.md (owner-approved amendment), docs/SUPABASE-SETUP.md, this plan, tests/unit/auth-session.test.ts, tests/e2e/auth-session.spec.ts, project-state.json (Orchestrator only).
Forbidden Files: other features, schemas, migrations, RLS, credentials, dependencies, harness internals and all other files.

Provider: Confirm email currently enabled (public settings mailer_autoconfirm false). No Supabase management credential, CLI or MCP connection available. Owner was asked to change the setting in the project's dashboard while code work continues. Do not claim deployed provider behavior until verified.

Validation: mock real provider response boundaries for session success/failure, signup without session, onboarding ownership and unauthenticated rejection. E2E legacy verification route redirects without resend UI. Run required build/type/unit/E2E/harness checks.

## Validation results
TypeScript and production build PASS. Unit tests 138/138, browser tests 9/9, harness tests 86/86. Lint has no errors and 14 unchanged warnings elsewhere. New tests verify authenticated unconfirmed sessions, rejection without a session, provider errors, signup session absence, private layout gate, owner-scoped onboarding and legacy verification URLs.

Status: code complete; hosted provider setting pending. No live account login was attempted and no email was sent by this work. Only the owner can currently change the Supabase setting using dashboard access. No admin key, admin confirmation endpoint or RLS change was introduced.
