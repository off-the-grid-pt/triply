# Triply — Technical Architecture
Version: 1.0
Status: ACCEPTED BASELINE
Date: 2026-09-01

## 1. Purpose
This document is the implementation-level architecture baseline used by all Triply agents. Product behavior comes from approved specs; this document decides how that behavior is partitioned technically.

## 2. System shape
Triply is a server-first Next.js web application backed by Supabase.

```text
Browser
  │
  ├─ Server-rendered App Router UI
  ├─ Client Components only for interactive islands
  │
Next.js application boundary
  ├─ Server Components — authenticated reads / composition
  ├─ Server Actions — first-party mutations/forms
  ├─ Route Handlers — auth callback, private file delivery, future webhooks/API contracts
  ├─ Zod validation at trusted boundaries
  │
Domain / feature services
  ├─ auth
  ├─ trips
  ├─ route (stops + legs)
  ├─ finance
  ├─ savings
  ├─ itinerary
  ├─ reservations/checklists
  ├─ documents
  └─ dashboard/settings
  │
Supabase
  ├─ Auth
  ├─ PostgreSQL + RLS
  └─ Private Storage
```

## 3. Repository layout
Target layout after bootstrap:

```text
app/
  (public)/
    auth/
  (app)/
    layout.tsx
    page.tsx
    trips/
  auth/callback/route.ts
  actions/                 # only cross-feature actions; prefer feature-local actions
components/
  ui/                      # shadcn/ui primitives
  shared/                  # cross-feature presentational components
features/
  auth/
    actions/
    components/
    schemas/
    server/
    types/
  trips/
  route/
  finance/
  savings/
  itinerary/
  reservations/
  documents/
  dashboard/
  settings/
lib/
  supabase/
    client.ts
    server.ts
    proxy.ts
  money/
  time/
  validation/
supabase/
  migrations/
  seed.sql                 # only if/when approved
tests/
  e2e/
  integration/
```

Feature folders own their business rules. Pages compose features; they do not become business-logic containers.

## 4. Rendering and data-access rules
1. Server Components are the default.
2. Add `"use client"` only at the smallest interactive boundary.
3. Domain reads should originate on the server. Browser-direct database reads are exceptional and must remain RLS-protected.
4. Server Actions perform first-party mutations and revalidate affected paths/tags.
5. Route Handlers are not a second internal API layer unless an HTTP contract is genuinely required.
6. TanStack Query is opt-in, not a default wrapper around every Supabase query. Use it when client-side caching/refetching materially improves UX.

## 5. Authentication
Follow ADR-005. The application uses Supabase Auth via `@supabase/ssr` with cookie-backed sessions.

Route states:
- public visitor;
- authenticated + email verification incomplete;
- authenticated + onboarding incomplete;
- authenticated + onboarding complete.

Route protection is a UX/application gate, not the authorization boundary. RLS is the final data boundary.

## 6. Database and ownership model
- PostgreSQL UUID identifiers.
- `auth.users.id` is the canonical authenticated identity.
- Product profile is one-to-one with `auth.users`.
- Every user-owned aggregate must have an ownership path that RLS can verify.
- Prefer direct `user_id` on top-level user-owned tables when it simplifies RLS and operational safety.
- Child tables may authorize through an immutable parent relationship when appropriate, but policy complexity must remain testable.
- All public/exposed tables have RLS enabled before feature completion.
- Migrations are append-only after acceptance; never edit production-applied migrations.

## 7. Domain boundaries
### Auth
Identity, profile, onboarding state, default locale/currency.

### Trips
Trip container: name, global dates, travellers count, base currency, target budget, boundaries/lifecycle.

### Route
Ordered stops and travel legs. This module owns adjacency and reordering invariants.

### Finance
Planned cost items, payments, actual spend, adjustments/refunds, categories and normalized money.

### Savings
Derived funding target/progress plus the user's current available funds. It consumes Finance; it does not reimplement Finance totals.

### Itinerary
Daily activities and presentation of canonical travel legs in the daily timeline.

### Reservations / Checklists
Booking metadata and task completion. Payment truth remains Finance; transport truth remains Route.

### Documents
Private document metadata and storage references.

### Dashboard
Read-only aggregation/projection over canonical modules. It owns no duplicate business truth.

## 8. Money
Follow ADR-002. Authoritative persisted amounts use integer minor units. Money helpers must understand ISO currency minor-unit metadata rather than assuming 2 decimals.

No component performs authoritative arithmetic using formatted strings or JS floating point.

## 9. Dates, times and timezones
Follow ADR-003.
- Trip/stay calendar dates remain calendar dates.
- Scheduled local times preserve IANA timezone.
- UTC conversion is performed only for cross-timezone ordering/comparison where an instant is required.
- Date-only values must never be accidentally shifted by converting through midnight UTC.

## 10. Validation
Validation exists at multiple layers:
- form/UI validation for feedback;
- Zod/server validation at mutation boundaries;
- database constraints for invariants the database can guarantee;
- RLS for authorization.

Client validation never replaces server/database validation.

## 11. Error handling
- Expected domain failures use typed results/errors and user-safe messages.
- Unexpected server errors are not exposed verbatim to users.
- Auth endpoints follow anti-enumeration rules.
- Logging excludes secrets, tokens, document contents and identity-document numbers.

## 12. Security baseline
- RLS mandatory.
- Private storage mandatory for uploaded documents.
- Secret/service-role keys server-only.
- No auth tokens in localStorage/sessionStorage.
- Internal redirects only after auth.
- CSRF/session behavior follows framework/Supabase SSR best practice; state-changing operations are same-origin server actions by default.
- Rate-limit/abuse responses from Auth are surfaced without uncontrolled retries.

Security milestones: after Module 01, after Module 08, and before production.

## 13. Testing strategy
### Unit
Pure money, savings, route ordering, date/time helpers and validation schemas.

### Integration
Server actions/services, database constraints and auth/RLS behavior.

### E2E
Critical user journeys: auth/onboarding, create multi-stop trip, budget, itinerary, reservation/checklist, document access.

### Security
Cross-user access attempts, direct-id tampering, private-storage access, auth redirect attacks and token/log leakage.

## 14. Performance principles
- Avoid client waterfalls by composing server reads.
- Fetch only fields needed by a view.
- Add indexes from demonstrated query patterns/data relationships, not speculative indexing.
- Dashboard aggregation may move to database views/RPC later if measured query cost requires it; no premature denormalized duplicate truth.

## 15. Deployment boundary
No production deployment is authorized by this architecture. CI/CD, hosting project creation, DNS and production secrets remain human-gated operations.

## 16. Bootstrap prerequisite
Before Module 01 implementation runs, the repository must contain the Next.js application scaffold, baseline dependencies, root TypeScript config, test scripts, `.env.example`, and a local Supabase development strategy. The bootstrap is infrastructure setup, not a product behavior decision.
