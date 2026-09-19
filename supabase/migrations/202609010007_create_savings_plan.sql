-- Triply — Module 05: Savings Plan current available funds
begin;

create table public.savings_plans (
  trip_id uuid primary key references public.trips(id) on delete cascade,
  current_available_minor bigint not null default 0 check (current_available_minor >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  last_request_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index savings_plans_trip_request_unique on public.savings_plans (trip_id, last_request_id);
create trigger savings_plans_set_updated_at before update on public.savings_plans for each row execute function public.set_updated_at();

create or replace function public.validate_savings_plan() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare v_base_currency text;
begin
  select base_currency into v_base_currency from public.trips where id = new.trip_id;
  if v_base_currency is null then raise exception 'trip_not_available'; end if;
  if new.currency <> v_base_currency then raise exception 'savings_currency_mismatch'; end if;
  return new;
end;
$$;

create trigger savings_plans_validate before insert or update on public.savings_plans
for each row execute function public.validate_savings_plan();

alter table public.savings_plans enable row level security;
revoke all on public.savings_plans from anon, authenticated;
grant select, insert, update on public.savings_plans to authenticated;

create policy "savings_plans_owner_select" on public.savings_plans for select to authenticated
using (exists (select 1 from public.trips where trips.id = savings_plans.trip_id and trips.user_id = (select auth.uid())));
create policy "savings_plans_owner_insert" on public.savings_plans for insert to authenticated
with check (exists (select 1 from public.trips where trips.id = savings_plans.trip_id and trips.user_id = (select auth.uid())));
create policy "savings_plans_owner_update" on public.savings_plans for update to authenticated
using (exists (select 1 from public.trips where trips.id = savings_plans.trip_id and trips.user_id = (select auth.uid())))
with check (exists (select 1 from public.trips where trips.id = savings_plans.trip_id and trips.user_id = (select auth.uid())));

commit;
