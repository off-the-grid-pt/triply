# ADR-005 — Authentication and session boundary
Status: accepted
Date: 2026-09-01

## Context
Triply needs secure email/password authentication in a Next.js App Router application using Supabase Auth. The product spec forbids storing auth tokens in browser local/session storage.

## Decision
- Use Supabase Auth with `@supabase/ssr` and cookie-based sessions.
- Use the PKCE-compatible SSR flow supplied by the library.
- Maintain distinct Supabase browser and server clients in `lib/supabase/`.
- Session refresh/protection is implemented at the framework request boundary using the current supported Next.js/Supabase SSR pattern.
- Authenticated/private routes are dynamic and must not use ISR where a refreshed session could be cached.
- Authorization is never based only on route protection: database RLS remains mandatory.
- Server Components are the default for authenticated reads; Server Actions are the default for app-owned form mutations. Route Handlers are reserved for auth callbacks, file/download endpoints, webhooks or contracts requiring an HTTP endpoint.
- Open redirects are forbidden; post-auth redirects must resolve to an approved internal path.

## Security notes
- Never expose service-role/secret keys to client bundles.
- Never log access tokens, refresh tokens, verification tokens or password-reset tokens.
- Authentication errors exposed to users follow the anti-enumeration rules in `spec/01-auth-onboarding.md`.
