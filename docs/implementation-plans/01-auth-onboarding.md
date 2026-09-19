# Implementation Plan — 01 Authentication & Onboarding
Status: READY FOR STAGED EXECUTION AFTER REPOSITORY BOOTSTRAP
Spec: `spec/01-auth-onboarding.md`
Architecture: `docs/TECHNICAL-ARCHITECTURE.md`
ADRs: 001, 005
Security milestone: mandatory after QA

## 1. Objective
Implement secure email/password authentication, email verification, recovery, session protection and minimal onboarding without creating trip functionality.

## 2. Architecture decisions
- Supabase Auth is canonical identity.
- `@supabase/ssr` cookie sessions; no local/session storage tokens.
- `profiles` is a private one-to-one product table keyed by authenticated user ID.
- Server Components are default for authenticated reads.
- Server Actions own registration/sign-in/recovery/onboarding mutations where practical.
- `/auth/callback` is a Route Handler for provider callback/code exchange.
- RLS is mandatory on `profiles`.
- No service-role key is needed in normal app flows.

## 3. Proposed data model
### `profiles`
- `user_id uuid primary key references auth.users(id) on delete cascade`
- `display_name text null` until onboarding
- `default_currency text null` until onboarding
- `locale text null` until onboarding
- `onboarding_completed_at timestamptz null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Database constraints:
- display name max 80 when present;
- default currency constrained to supported ISO code shape/list strategy chosen by Database agent without expanding product behavior;
- locale constrained to supported locales (`pt-PT` initially);
- onboarding completion requires the three required preference fields.

RLS:
- authenticated user can select/insert/update only `profiles.user_id = auth.uid()`;
- no anonymous access;
- cross-user reads/writes must fail in database tests.

Profile creation must be idempotent. The Database/Backend agent must choose between lazy `upsert` after verified authentication or a safe auth-user trigger; prefer the smallest design that does not require service-role application code.

## 4. Route plan
Public/auth routes (exact slugs may follow project locale conventions without changing behavior):
- sign in;
- create account;
- verify-email pending/result;
- forgot password;
- reset password;
- auth callback.

Private gates:
- onboarding route;
- private home/empty workspace.

Routing rule:
```text
no session -> public auth
session + unverified -> verification state
verified + onboarding incomplete -> onboarding
verified + onboarding complete -> private home
```

## 5. Server contracts
Actions/services should expose typed outcomes rather than raw Supabase errors. Minimum contracts:
- `signUp(input)`
- `signIn(input)`
- `signOut()`
- `requestPasswordReset(input)`
- `updatePassword(input)`
- `resendVerification()` if supported safely
- `completeOnboarding(input)`
- `getCurrentUserState()`

Every external input is Zod-validated server-side.

## 6. Security requirements
- Generic sign-in and recovery responses per spec.
- Internal-only redirect resolver.
- No sensitive auth payload logging.
- Authenticated routes must not be statically/ISR cached with refreshed session state.
- RLS tests include a second user attempting to access the first user's profile.
- Password reset and verification callback errors never yield a partially authorized private state.

## 7. Design handoff
Design stage must produce states for:
- sign in;
- create account;
- check email / pending verification;
- invalid/expired verification;
- forgot password confirmation;
- reset password;
- invalid/expired reset;
- onboarding;
- empty private workspace;
- loading/rate-limit/network/generic failure states;
- mobile + keyboard behavior.

Brand token decisions remain gated by `spec/00-design-system.md`.

## 8. Stage-by-stage file plan
### Architecture
Owns this plan and ADR proposals only.

### Design
Expected artifacts under approved design artifact location; no implementation business logic.

### Database
Expected scope:
- `supabase/migrations/*profiles*.sql`
- database/RLS tests
- generated DB types only if repository workflow includes them

### Backend
Expected scope:
- `lib/supabase/server.ts` / request-session utilities
- `features/auth/schemas/*`
- `features/auth/server/*`
- `features/auth/actions/*`
- `app/auth/callback/route.ts`
- route gate/proxy integration
- backend/integration tests

### Frontend
Expected scope:
- public auth pages/components
- onboarding form
- private empty workspace CTA
- client-only interactive components where required
- accessible error/loading/success states

### QA
Map every `FL-*` acceptance scenario from the spec to automated or explicit manual coverage. Critical paths require Playwright coverage.

### Security milestone
After QA approval, Security Agent audits auth/session/RLS/redirect/logging. Module 01 is not release-complete until the security milestone is `APPROVED`.

## 9. Validation gates
Required when the scaffold exists:
```bash
npx tsc --noEmit
npm run build
npm run test
npm run test:e2e
npm run test:harness
```

Database stage additionally runs the repository's Supabase migration/RLS test command when configured.

## 10. Explicit non-goals
No OAuth, social login, teams, avatars, billing, account deletion, email change, authenticated password-change settings or trip creation logic.

## 11. Execution blockers before first code run
- repository application scaffold does not yet exist in this orchestration package;
- dependencies/lockfile are not yet installed here;
- Supabase local/project environment variables are not configured;
- `spec/00-design-system.md` must be approved before visual implementation, though architecture/database/backend planning may proceed.
