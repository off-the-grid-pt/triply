-- Triply
-- Migration: create profiles table
-- Module: 01 Authentication & Onboarding

begin;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  default_currency text not null default 'EUR',
  locale text not null default 'pt-PT',
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_display_name_length_check
    check (display_name is null or char_length(trim(display_name)) between 1 and 120),

  constraint profiles_default_currency_check
    check (default_currency ~ '^[A-Z]{3}$'),

  constraint profiles_locale_length_check
    check (char_length(locale) between 2 and 35)
);

comment on table public.profiles is
  'One-to-one application profile for each authenticated Triply user.';

comment on column public.profiles.user_id is
  'References auth.users.id and is also the profile primary key.';

comment on column public.profiles.default_currency is
  'ISO 4217-style three-letter default currency code for newly created trips.';

comment on column public.profiles.onboarding_completed_at is
  'Null until the required onboarding flow has been completed.';

-- Keep updated_at server-controlled.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- Automatically create the application's profile record whenever
-- Supabase Auth creates a new user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    user_id,
    display_name,
    default_currency,
    locale
  )
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), ''),
    'EUR',
    'pt-PT'
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- Row Level Security is the final authorization boundary.
alter table public.profiles enable row level security;

-- Explicit privileges for authenticated users.
revoke all on table public.profiles from anon;
revoke all on table public.profiles from authenticated;

grant select, insert, update on table public.profiles to authenticated;

-- A user can only read their own profile.
drop policy if exists "profiles_select_own" on public.profiles;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = user_id);

-- Kept for safe/idempotent application flows even though the Auth trigger
-- normally creates the row automatically.
drop policy if exists "profiles_insert_own" on public.profiles;

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = user_id);

-- A user can only update their own profile.
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- No DELETE policy in the MVP.
-- Deleting an Auth user cascades to the profile through the FK.

commit;
