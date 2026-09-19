# Triply — Supabase Setup

Status: READY FOR MANUAL PROJECT CONNECTION

This guide connects the Triply repository to a hosted Supabase project without introducing a service-role secret into the web application.

## 1. Create the Supabase project

Create one hosted Supabase project for Triply. Choose the region closest to the primary user base. Store the database password in a password manager; it must not be committed to Git.

## 2. Copy the public project credentials

In the Supabase project, open the Connect/API area and copy:

- Project URL
- Publishable key (`sb_publishable_...`)

Create `.env.local` in the repository root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_REPLACE_ME
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Do not add a service-role/secret key to `NEXT_PUBLIC_*` variables. The current MVP does not require a service-role key in the Next.js application.

## 3. Configure Authentication

Supabase Dashboard → Authentication.

### Providers

For MVP:

- Email/password: enabled
- Email confirmation: disabled (owner-approved policy change, 2026-09-07). In Authentication → Sign In / Providers → Email, turn off **Confirm email** and save.
- Google/Apple/social login: disabled for now

### URL Configuration

For local development:

- Site URL: `http://localhost:3000`
- Redirect URL: `http://localhost:3000/**`

When production exists, replace Site URL with the canonical production origin and add exact production callback/reset URLs to the allow list. Wildcards are convenient for local/preview environments but exact production redirect URLs are preferred.

## 4. Apply the initial database migration

The first migration is:

`supabase/migrations/202609010001_create_profiles.sql`

For the first hosted setup, either:

### Option A — Supabase SQL Editor

Open SQL Editor, paste the whole migration, and run it once.

### Option B — Supabase CLI

After installing/logging into the CLI and linking this repo to the project, push migrations with the Supabase CLI.

The migration creates `public.profiles`, enables RLS, revokes broad grants, grants only authenticated select/insert/update, and creates per-operation policies enforcing `auth.uid() = user_id`.

## 5. Verify the database

In Table Editor, confirm `profiles` contains:

- `user_id` UUID primary key → `auth.users.id`
- `display_name`
- `default_currency` default `EUR`
- `locale` default `pt-PT`
- `onboarding_completed_at`
- timestamps

In the RLS/policies UI, confirm RLS is enabled and the table has separate SELECT, INSERT, and UPDATE policies for the authenticated role.

## 6. Storage

Do not create a public document bucket yet. Module 08 requires private files and explicit storage policies. The bucket and storage migration should be created when the Documents database/backend stage is executed, so storage rules remain aligned with the final document schema.

## 7. Local verification

Once dependencies are installed and `.env.local` exists:

```bash
npm run dev
```

Then verify the app boots without missing Supabase environment variable errors.

Before the auth agent is allowed to implement Module 01, run:

```bash
npm run typecheck
npm run build
npm run test
npm run test:harness
npm run harness:typecheck
npm run harness:ready
```

## Security invariants

- Never commit `.env.local`.
- Never expose a Supabase service-role/secret key in browser code.
- Every user-owned table must have RLS enabled.
- RLS policies must scope rows to the authenticated owner.
- Browser checks are UX only; database authorization is mandatory.
- Private document storage must remain non-public.

## Email confirmation policy verification
The application's public publishable key cannot change provider settings. Disabling the application gate alone does not override Supabase Auth. Verify `/auth/v1/settings` reports `mailer_autoconfirm: true` after saving the dashboard setting. Existing pending users must still supply the correct password; if a provider continues blocking a specific existing account, resolve only that account through the authenticated dashboard. Never bulk-confirm users or introduce an admin authentication bypass. Password recovery delivery remains dependent on SMTP configuration.
