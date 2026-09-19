-- Triply — Module 04: Budget & Expenses
begin;

create type public.financial_scope as enum ('trip', 'stop', 'travel_leg');

alter table public.travel_legs add constraint travel_legs_id_trip_unique unique (id, trip_id);

create table public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  slug text,
  is_default boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint expense_categories_name_check check (char_length(trim(name)) between 1 and 60),
  constraint expense_categories_shape_check check (
    (is_default and user_id is null and slug is not null) or
    (not is_default and user_id is not null and slug is null)
  )
);

create unique index expense_categories_default_slug_unique on public.expense_categories (slug) where is_default;
create unique index expense_categories_user_name_unique on public.expense_categories (user_id, lower(trim(name))) where not is_default;

insert into public.expense_categories (id, name, slug, is_default) values
('10000000-0000-4000-8000-000000000001','Alojamento','accommodation',true),
('10000000-0000-4000-8000-000000000002','Transportes','transport',true),
('10000000-0000-4000-8000-000000000003','Alimentação','food',true),
('10000000-0000-4000-8000-000000000004','Atividades','activities',true),
('10000000-0000-4000-8000-000000000005','Compras','shopping',true),
('10000000-0000-4000-8000-000000000006','Seguro','insurance',true),
('10000000-0000-4000-8000-000000000007','Vistos e taxas','visas-fees',true),
('10000000-0000-4000-8000-000000000008','Saúde','health',true),
('10000000-0000-4000-8000-000000000009','Comunicações','communications',true),
('10000000-0000-4000-8000-000000000010','Documentos','documents',true),
('10000000-0000-4000-8000-000000000011','Gorjetas','tips',true),
('10000000-0000-4000-8000-000000000012','Emergências','emergencies',true),
('10000000-0000-4000-8000-000000000013','Outros','other',true);

create table public.cost_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  category_id uuid not null references public.expense_categories(id) on delete restrict,
  title text not null,
  scope_type public.financial_scope not null,
  stop_id uuid,
  travel_leg_id uuid,
  estimated_original_minor bigint,
  estimated_currency text,
  estimated_base_minor bigint,
  estimated_conversion_rate numeric(30,12),
  committed_original_minor bigint,
  committed_currency text,
  committed_base_minor bigint,
  committed_conversion_rate numeric(30,12),
  notes text,
  archived_at timestamptz,
  create_request_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cost_items_id_trip_unique unique (id, trip_id),
  constraint cost_items_request_unique unique (trip_id, create_request_id),
  constraint cost_items_title_check check (char_length(trim(title)) between 1 and 120),
  constraint cost_items_notes_check check (notes is null or char_length(notes) <= 2000),
  constraint cost_items_scope_check check (
    (scope_type = 'trip' and stop_id is null and travel_leg_id is null) or
    (scope_type = 'stop' and stop_id is not null and travel_leg_id is null) or
    (scope_type = 'travel_leg' and stop_id is null and travel_leg_id is not null)
  ),
  constraint cost_items_estimated_check check (
    (estimated_original_minor is null and estimated_currency is null and estimated_base_minor is null and estimated_conversion_rate is null) or
    (estimated_original_minor >= 0 and estimated_currency ~ '^[A-Z]{3}$' and estimated_base_minor >= 0 and estimated_conversion_rate > 0)
  ),
  constraint cost_items_committed_check check (
    (committed_original_minor is null and committed_currency is null and committed_base_minor is null and committed_conversion_rate is null) or
    (committed_original_minor >= 0 and committed_currency ~ '^[A-Z]{3}$' and committed_base_minor >= 0 and committed_conversion_rate > 0)
  ),
  constraint cost_items_stop_fk foreign key (stop_id, trip_id) references public.stops(id, trip_id) on delete restrict,
  constraint cost_items_leg_fk foreign key (travel_leg_id, trip_id) references public.travel_legs(id, trip_id) on delete restrict
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  cost_item_id uuid,
  amount_original_minor bigint not null check (amount_original_minor >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  base_amount_minor bigint not null check (base_amount_minor >= 0),
  conversion_rate numeric(30,12) not null check (conversion_rate > 0),
  paid_on date not null,
  notes text check (notes is null or char_length(notes) <= 2000),
  request_id uuid not null,
  created_at timestamptz not null default now(),
  constraint payments_request_unique unique (trip_id, request_id),
  constraint payments_cost_fk foreign key (cost_item_id, trip_id) references public.cost_items(id, trip_id)
);

create table public.actual_expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  cost_item_id uuid,
  category_id uuid not null references public.expense_categories(id) on delete restrict,
  title text,
  scope_type public.financial_scope not null,
  stop_id uuid,
  travel_leg_id uuid,
  amount_original_minor bigint not null check (amount_original_minor >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  base_amount_minor bigint not null check (base_amount_minor >= 0),
  conversion_rate numeric(30,12) not null check (conversion_rate > 0),
  spent_on date not null,
  notes text check (notes is null or char_length(notes) <= 2000),
  request_id uuid not null,
  created_at timestamptz not null default now(),
  constraint actual_expenses_request_unique unique (trip_id, request_id),
  constraint actual_expenses_title_check check (title is null or char_length(trim(title)) between 1 and 120),
  constraint actual_expenses_standalone_title_check check (cost_item_id is not null or title is not null),
  constraint actual_expenses_scope_check check (
    (scope_type = 'trip' and stop_id is null and travel_leg_id is null) or
    (scope_type = 'stop' and stop_id is not null and travel_leg_id is null) or
    (scope_type = 'travel_leg' and stop_id is null and travel_leg_id is not null)
  ),
  constraint actual_expenses_cost_fk foreign key (cost_item_id, trip_id) references public.cost_items(id, trip_id),
  constraint actual_expenses_stop_fk foreign key (stop_id, trip_id) references public.stops(id, trip_id) on delete restrict,
  constraint actual_expenses_leg_fk foreign key (travel_leg_id, trip_id) references public.travel_legs(id, trip_id) on delete restrict
);

create table public.financial_adjustments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  payment_id uuid,
  actual_expense_id uuid,
  amount_original_minor bigint not null check (amount_original_minor < 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  base_amount_minor bigint not null check (base_amount_minor < 0),
  conversion_rate numeric(30,12) not null check (conversion_rate > 0),
  adjusted_on date not null,
  notes text check (notes is null or char_length(trim(notes)) between 1 and 2000),
  request_id uuid not null,
  created_at timestamptz not null default now(),
  constraint financial_adjustments_request_unique unique (trip_id, request_id),
  constraint financial_adjustments_target_check check ((payment_id is not null)::integer + (actual_expense_id is not null)::integer = 1)
);

alter table public.payments add constraint payments_id_trip_unique unique (id, trip_id);
alter table public.actual_expenses add constraint actual_expenses_id_trip_unique unique (id, trip_id);
alter table public.financial_adjustments add constraint financial_adjustments_payment_fk foreign key (payment_id, trip_id) references public.payments(id, trip_id);
alter table public.financial_adjustments add constraint financial_adjustments_actual_fk foreign key (actual_expense_id, trip_id) references public.actual_expenses(id, trip_id);

create index cost_items_trip_category_idx on public.cost_items (trip_id, category_id) where archived_at is null;
create index cost_items_trip_stop_idx on public.cost_items (trip_id, stop_id) where stop_id is not null;
create index cost_items_trip_leg_idx on public.cost_items (trip_id, travel_leg_id) where travel_leg_id is not null;
create index payments_trip_cost_date_idx on public.payments (trip_id, cost_item_id, paid_on, created_at);
create index actual_expenses_trip_category_date_idx on public.actual_expenses (trip_id, category_id, spent_on, created_at);
create index actual_expenses_trip_stop_idx on public.actual_expenses (trip_id, stop_id) where stop_id is not null;
create index adjustments_trip_created_idx on public.financial_adjustments (trip_id, created_at);

create trigger expense_categories_set_updated_at before update on public.expense_categories for each row execute function public.set_updated_at();
create trigger cost_items_set_updated_at before update on public.cost_items for each row execute function public.set_updated_at();

create or replace function public.validate_financial_record() returns trigger language plpgsql security invoker set search_path = '' as $$
declare v_base text; v_category_owner uuid; v_category_default boolean; v_category_archived timestamptz;
begin
  select base_currency into v_base from public.trips where id = new.trip_id;
  if v_base is null then raise exception 'trip_not_available'; end if;
  if tg_table_name in ('cost_items','actual_expenses') then
    select user_id, is_default, archived_at into v_category_owner, v_category_default, v_category_archived from public.expense_categories where id = new.category_id;
    if not found or (not v_category_default and v_category_owner <> (select auth.uid())) or (v_category_archived is not null and (tg_op = 'INSERT' or old.category_id is distinct from new.category_id)) then raise exception 'category_not_available'; end if;
  end if;
  if tg_table_name = 'cost_items' then
    if new.estimated_currency = v_base and (new.estimated_base_minor <> new.estimated_original_minor or new.estimated_conversion_rate <> 1) then raise exception 'invalid_same_currency_conversion'; end if;
    if new.committed_currency = v_base and (new.committed_base_minor <> new.committed_original_minor or new.committed_conversion_rate <> 1) then raise exception 'invalid_same_currency_conversion'; end if;
  else
    if tg_table_name = 'payments' and new.paid_on > current_date then raise exception 'future_payment_not_allowed'; end if;
    if tg_table_name = 'financial_adjustments' and new.adjusted_on > current_date then raise exception 'future_adjustment_not_allowed'; end if;
    if new.currency = v_base and (new.base_amount_minor <> new.amount_original_minor or new.conversion_rate <> 1) then raise exception 'invalid_same_currency_conversion'; end if;
  end if;
  return new;
end;
$$;

create trigger cost_items_validate before insert or update on public.cost_items for each row execute function public.validate_financial_record();
create trigger payments_validate before insert or update on public.payments for each row execute function public.validate_financial_record();
create trigger actual_expenses_validate before insert or update on public.actual_expenses for each row execute function public.validate_financial_record();
create trigger financial_adjustments_validate before insert or update on public.financial_adjustments for each row execute function public.validate_financial_record();

create or replace function public.prevent_trip_base_currency_change() returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.base_currency <> old.base_currency and (
    exists (select 1 from public.cost_items where trip_id = old.id) or
    exists (select 1 from public.payments where trip_id = old.id) or
    exists (select 1 from public.actual_expenses where trip_id = old.id) or
    exists (select 1 from public.financial_adjustments where trip_id = old.id)
  ) then raise exception 'base_currency_locked_by_financial_data'; end if;
  return new;
end;
$$;
create trigger trips_lock_financial_currency before update of base_currency on public.trips for each row execute function public.prevent_trip_base_currency_change();

alter table public.expense_categories enable row level security;
alter table public.cost_items enable row level security;
alter table public.payments enable row level security;
alter table public.actual_expenses enable row level security;
alter table public.financial_adjustments enable row level security;
revoke all on public.expense_categories, public.cost_items, public.payments, public.actual_expenses, public.financial_adjustments from anon, authenticated;
grant select on public.expense_categories to authenticated;
grant insert, update, delete on public.expense_categories to authenticated;
grant select, insert, update, delete on public.cost_items, public.payments, public.actual_expenses, public.financial_adjustments to authenticated;

create policy "categories_read_available" on public.expense_categories for select to authenticated using (is_default or user_id = (select auth.uid()));
create policy "categories_insert_own" on public.expense_categories for insert to authenticated with check (not is_default and user_id = (select auth.uid()));
create policy "categories_update_own" on public.expense_categories for update to authenticated using (not is_default and user_id = (select auth.uid())) with check (not is_default and user_id = (select auth.uid()));
create policy "categories_delete_own" on public.expense_categories for delete to authenticated using (not is_default and user_id = (select auth.uid()));

create policy "cost_items_owner_all" on public.cost_items for all to authenticated
 using (exists (select 1 from public.trips where trips.id = cost_items.trip_id and trips.user_id = (select auth.uid())))
 with check (exists (select 1 from public.trips where trips.id = cost_items.trip_id and trips.user_id = (select auth.uid())));
create policy "payments_owner_all" on public.payments for all to authenticated
 using (exists (select 1 from public.trips where trips.id = payments.trip_id and trips.user_id = (select auth.uid())))
 with check (exists (select 1 from public.trips where trips.id = payments.trip_id and trips.user_id = (select auth.uid())));
create policy "actual_expenses_owner_all" on public.actual_expenses for all to authenticated
 using (exists (select 1 from public.trips where trips.id = actual_expenses.trip_id and trips.user_id = (select auth.uid())))
 with check (exists (select 1 from public.trips where trips.id = actual_expenses.trip_id and trips.user_id = (select auth.uid())));
create policy "adjustments_owner_all" on public.financial_adjustments for all to authenticated
 using (exists (select 1 from public.trips where trips.id = financial_adjustments.trip_id and trips.user_id = (select auth.uid())))
 with check (exists (select 1 from public.trips where trips.id = financial_adjustments.trip_id and trips.user_id = (select auth.uid())));

commit;
