-- Triply
-- Migration: create trips table
-- Module: 02 Trips

begin;

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  origin_label text,
  return_label text,
  travelers_count integer not null default 1,
  base_currency text not null,
  target_budget_minor bigint,
  archived_at timestamptz,
  create_request_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint trips_name_check
    check (char_length(trim(name)) between 1 and 100),
  constraint trips_date_range_check
    check (end_date >= start_date),
  constraint trips_origin_label_check
    check (origin_label is null or char_length(trim(origin_label)) between 1 and 120),
  constraint trips_return_label_check
    check (return_label is null or char_length(trim(return_label)) between 1 and 120),
  constraint trips_travelers_count_check
    check (travelers_count >= 1),
  constraint trips_base_currency_check
    check (base_currency in ('EUR', 'GBP', 'USD', 'CHF', 'JPY', 'CZK', 'PLN', 'HUF')),
  constraint trips_target_budget_minor_check
    check (target_budget_minor is null or target_budget_minor >= 0),
  constraint trips_user_create_request_unique
    unique (user_id, create_request_id)
);

comment on table public.trips is
  'Private top-level trip containers. Stops and travel legs are owned by Module 03.';
comment on column public.trips.origin_label is
  'Optional route boundary; never a destination or stop.';
comment on column public.trips.return_label is
  'Optional final route boundary; never a destination or stop.';
comment on column public.trips.target_budget_minor is
  'Optional total target in base-currency minor units; null and zero are distinct.';
comment on column public.trips.create_request_id is
  'Per-owner idempotency key preventing duplicate create submissions.';

create index trips_user_active_dates_idx
  on public.trips (user_id, start_date, end_date)
  where archived_at is null;

create index trips_user_archived_idx
  on public.trips (user_id, archived_at desc)
  where archived_at is not null;

create trigger trips_set_updated_at
before update on public.trips
for each row
execute function public.set_updated_at();

alter table public.trips enable row level security;

revoke all on table public.trips from anon;
revoke all on table public.trips from authenticated;
grant select, insert, update, delete on table public.trips to authenticated;

create policy "trips_select_own"
on public.trips
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "trips_insert_own"
on public.trips
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "trips_update_own"
on public.trips
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "trips_delete_own"
on public.trips
for delete
to authenticated
using ((select auth.uid()) = user_id);

commit;
