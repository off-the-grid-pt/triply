-- Triply — Module 03: ordered Stops and adjacent Travel Legs
begin;

create table public.stops (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  position integer not null,
  place_name text not null,
  country_code text not null,
  country_name text not null,
  arrival_date date not null,
  departure_date date not null,
  timezone text,
  notes text,
  create_request_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stops_id_trip_unique unique (id, trip_id),
  constraint stops_trip_position_unique unique (trip_id, position) deferrable initially immediate,
  constraint stops_request_unique unique (trip_id, create_request_id),
  constraint stops_position_check check (position >= 1),
  constraint stops_place_check check (char_length(trim(place_name)) between 1 and 120),
  constraint stops_country_code_check check (country_code ~ '^[A-Z]{2}$'),
  constraint stops_country_name_check check (char_length(trim(country_name)) between 1 and 100),
  constraint stops_date_range_check check (departure_date >= arrival_date),
  constraint stops_timezone_check check (timezone is null or char_length(trim(timezone)) between 1 and 100),
  constraint stops_notes_check check (notes is null or char_length(notes) <= 2000)
);

create type public.route_point_kind as enum ('origin_boundary', 'stop', 'return_boundary');
create type public.travel_mode as enum ('plane', 'train', 'bus', 'car', 'ferry', 'other');
create type public.travel_leg_status as enum ('planned', 'booked', 'paid', 'cancelled', 'completed');

create table public.travel_legs (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  from_kind public.route_point_kind not null,
  from_stop_id uuid,
  to_kind public.route_point_kind not null,
  to_stop_id uuid,
  mode public.travel_mode not null,
  status public.travel_leg_status not null default 'planned',
  departure_date date,
  departure_time time without time zone,
  departure_timezone text,
  arrival_date date,
  arrival_time time without time zone,
  arrival_timezone text,
  operator text,
  reference text,
  price_minor bigint,
  price_currency text,
  notes text,
  review_required boolean not null default false,
  create_request_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint travel_legs_request_unique unique (trip_id, create_request_id),
  constraint travel_legs_from_shape_check check (
    (from_kind = 'stop' and from_stop_id is not null) or
    (from_kind = 'origin_boundary' and from_stop_id is null)
  ),
  constraint travel_legs_to_shape_check check (
    (to_kind = 'stop' and to_stop_id is not null) or
    (to_kind = 'return_boundary' and to_stop_id is null)
  ),
  constraint travel_legs_distinct_stops_check check (from_stop_id is null or to_stop_id is null or from_stop_id <> to_stop_id),
  constraint travel_legs_price_check check ((price_minor is null and price_currency is null) or (price_minor >= 0 and price_currency ~ '^[A-Z]{3}$')),
  constraint travel_legs_departure_time_check check (departure_time is null or (departure_date is not null and departure_timezone is not null)),
  constraint travel_legs_arrival_time_check check (arrival_time is null or (arrival_date is not null and arrival_timezone is not null)),
  constraint travel_legs_operator_check check (operator is null or char_length(trim(operator)) between 1 and 120),
  constraint travel_legs_reference_check check (reference is null or char_length(trim(reference)) between 1 and 120),
  constraint travel_legs_notes_check check (notes is null or char_length(notes) <= 2000),
  constraint travel_legs_from_stop_fk foreign key (from_stop_id, trip_id) references public.stops(id, trip_id) on delete restrict,
  constraint travel_legs_to_stop_fk foreign key (to_stop_id, trip_id) references public.stops(id, trip_id) on delete restrict
);

create index stops_trip_position_idx on public.stops (trip_id, position);
create index travel_legs_trip_idx on public.travel_legs (trip_id, review_required, status);
create unique index travel_legs_one_active_adjacency_idx
  on public.travel_legs (trip_id, from_kind, from_stop_id, to_kind, to_stop_id) nulls not distinct
  where status <> 'cancelled' and review_required = false;

create trigger stops_set_updated_at before update on public.stops for each row execute function public.set_updated_at();
create trigger travel_legs_set_updated_at before update on public.travel_legs for each row execute function public.set_updated_at();

create or replace function public.route_points_are_adjacent(
  p_trip_id uuid, p_from_kind public.route_point_kind, p_from_stop_id uuid,
  p_to_kind public.route_point_kind, p_to_stop_id uuid
) returns boolean language plpgsql stable security invoker set search_path = '' as $$
declare v_first uuid; v_last uuid; v_origin text; v_return text; v_from_position integer; v_to_position integer;
begin
  select origin_label, return_label into v_origin, v_return from public.trips where id = p_trip_id;
  select id into v_first from public.stops where trip_id = p_trip_id order by position asc limit 1;
  select id into v_last from public.stops where trip_id = p_trip_id order by position desc limit 1;
  if p_from_kind = 'origin_boundary' then return v_origin is not null and p_to_kind = 'stop' and p_to_stop_id = v_first; end if;
  if p_to_kind = 'return_boundary' then return v_return is not null and p_from_kind = 'stop' and p_from_stop_id = v_last; end if;
  if p_from_kind <> 'stop' or p_to_kind <> 'stop' then return false; end if;
  select position into v_from_position from public.stops where id = p_from_stop_id and trip_id = p_trip_id;
  select position into v_to_position from public.stops where id = p_to_stop_id and trip_id = p_trip_id;
  return v_to_position = v_from_position + 1;
end;
$$;

create or replace function public.validate_stop_route() returns trigger language plpgsql security invoker set search_path = '' as $$
declare v_trip_start date; v_trip_end date; v_previous_departure date; v_next_arrival date;
begin
  select start_date, end_date into v_trip_start, v_trip_end from public.trips where id = new.trip_id;
  if v_trip_start is null then raise exception 'trip_not_available'; end if;
  if new.arrival_date < v_trip_start or new.departure_date > v_trip_end then raise exception 'stop_outside_trip_dates'; end if;
  select departure_date into v_previous_departure from public.stops where trip_id = new.trip_id and position = new.position - 1;
  select arrival_date into v_next_arrival from public.stops where trip_id = new.trip_id and position = new.position + 1;
  if v_previous_departure is not null and v_previous_departure > new.arrival_date then raise exception 'stop_overlaps_previous'; end if;
  if v_next_arrival is not null and new.departure_date > v_next_arrival then raise exception 'stop_overlaps_next'; end if;
  return new;
end;
$$;

create constraint trigger stops_validate_route after insert or update on public.stops
  deferrable initially deferred for each row execute function public.validate_stop_route();

create or replace function public.validate_travel_leg() returns trigger language plpgsql security invoker set search_path = '' as $$
declare v_trip_start date; v_trip_end date; v_departure_instant timestamptz; v_arrival_instant timestamptz;
begin
  if not new.review_required and not public.route_points_are_adjacent(new.trip_id, new.from_kind, new.from_stop_id, new.to_kind, new.to_stop_id) then
    raise exception 'leg_endpoints_not_adjacent';
  end if;
  select start_date, end_date into v_trip_start, v_trip_end from public.trips where id = new.trip_id;
  if new.departure_date is not null and (new.departure_date < v_trip_start or new.departure_date > v_trip_end) then raise exception 'leg_departure_outside_trip'; end if;
  if new.arrival_date is not null and (new.arrival_date < v_trip_start or new.arrival_date > v_trip_end) then raise exception 'leg_arrival_outside_trip'; end if;
  if new.departure_timezone is not null and not exists (select 1 from pg_catalog.pg_timezone_names where name = new.departure_timezone) then raise exception 'invalid_departure_timezone'; end if;
  if new.arrival_timezone is not null and not exists (select 1 from pg_catalog.pg_timezone_names where name = new.arrival_timezone) then raise exception 'invalid_arrival_timezone'; end if;
  if new.departure_date is not null and new.arrival_date is not null then
    if new.departure_time is not null and new.arrival_time is not null then
      v_departure_instant := (new.departure_date + new.departure_time) at time zone new.departure_timezone;
      v_arrival_instant := (new.arrival_date + new.arrival_time) at time zone new.arrival_timezone;
      if v_arrival_instant < v_departure_instant then raise exception 'leg_arrival_before_departure'; end if;
    elsif new.arrival_date < new.departure_date then raise exception 'leg_arrival_before_departure'; end if;
  end if;
  return new;
end;
$$;

create trigger travel_legs_validate before insert or update on public.travel_legs for each row execute function public.validate_travel_leg();

alter table public.stops enable row level security;
alter table public.travel_legs enable row level security;
revoke all on public.stops, public.travel_legs from anon, authenticated;
grant select, insert, update, delete on public.stops, public.travel_legs to authenticated;

create policy "stops_owner_all" on public.stops for all to authenticated
  using (exists (select 1 from public.trips where trips.id = stops.trip_id and trips.user_id = (select auth.uid())))
  with check (exists (select 1 from public.trips where trips.id = stops.trip_id and trips.user_id = (select auth.uid())));
create policy "travel_legs_owner_all" on public.travel_legs for all to authenticated
  using (exists (select 1 from public.trips where trips.id = travel_legs.trip_id and trips.user_id = (select auth.uid())))
  with check (exists (select 1 from public.trips where trips.id = travel_legs.trip_id and trips.user_id = (select auth.uid())));

create or replace function public.create_route_stop(
  p_trip_id uuid, p_place_name text, p_country_code text, p_country_name text,
  p_arrival_date date, p_departure_date date, p_timezone text, p_notes text, p_request_id uuid
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare v_id uuid; v_position integer;
begin
  perform 1 from public.trips where id = p_trip_id and user_id = (select auth.uid()) for update;
  if not found then raise exception 'trip_not_available'; end if;
  select id into v_id from public.stops where trip_id = p_trip_id and create_request_id = p_request_id;
  if v_id is not null then return v_id; end if;
  select coalesce(max(position), 0) + 1 into v_position from public.stops where trip_id = p_trip_id;
  insert into public.stops (trip_id, position, place_name, country_code, country_name, arrival_date, departure_date, timezone, notes, create_request_id)
  values (p_trip_id, v_position, trim(p_place_name), upper(p_country_code), trim(p_country_name), p_arrival_date, p_departure_date, nullif(trim(p_timezone), ''), nullif(trim(p_notes), ''), p_request_id)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.reorder_route_stops(p_trip_id uuid, p_stop_ids uuid[]) returns void
language plpgsql security invoker set search_path = '' as $$
declare v_count integer;
begin
  perform 1 from public.trips where id = p_trip_id and user_id = (select auth.uid()) for update;
  if not found then raise exception 'trip_not_available'; end if;
  select count(*) into v_count from public.stops where trip_id = p_trip_id;
  if coalesce(array_length(p_stop_ids, 1), 0) <> v_count or
     (select count(distinct value) from unnest(p_stop_ids) value) <> v_count or
     exists (select 1 from unnest(p_stop_ids) value where not exists (select 1 from public.stops where id = value and trip_id = p_trip_id))
  then raise exception 'invalid_stop_sequence'; end if;
  set constraints stops_trip_position_unique deferred;
  update public.stops s set position = sequence.ordinality
  from unnest(p_stop_ids) with ordinality as sequence(id, ordinality)
  where s.id = sequence.id and s.trip_id = p_trip_id;
  update public.travel_legs leg set review_required = true
  where leg.trip_id = p_trip_id and leg.review_required = false
    and not public.route_points_are_adjacent(leg.trip_id, leg.from_kind, leg.from_stop_id, leg.to_kind, leg.to_stop_id);
end;
$$;

create or replace function public.delete_route_stop(p_trip_id uuid, p_stop_id uuid) returns integer
language plpgsql security invoker set search_path = '' as $$
declare v_position integer; v_legs integer;
begin
  perform 1 from public.trips where id = p_trip_id and user_id = (select auth.uid()) for update;
  if not found then raise exception 'trip_not_available'; end if;
  select position into v_position from public.stops where id = p_stop_id and trip_id = p_trip_id for update;
  if v_position is null then raise exception 'stop_not_available'; end if;
  select count(*) into v_legs from public.travel_legs where trip_id = p_trip_id and (from_stop_id = p_stop_id or to_stop_id = p_stop_id);
  delete from public.travel_legs where trip_id = p_trip_id and (from_stop_id = p_stop_id or to_stop_id = p_stop_id);
  delete from public.stops where id = p_stop_id and trip_id = p_trip_id;
  set constraints stops_trip_position_unique deferred;
  update public.stops set position = position - 1 where trip_id = p_trip_id and position > v_position;
  update public.travel_legs leg set review_required = true
  where leg.trip_id = p_trip_id and leg.review_required = false
    and not public.route_points_are_adjacent(leg.trip_id, leg.from_kind, leg.from_stop_id, leg.to_kind, leg.to_stop_id);
  return v_legs;
end;
$$;

revoke all on function public.create_route_stop(uuid,text,text,text,date,date,text,text,uuid) from public;
revoke all on function public.reorder_route_stops(uuid,uuid[]) from public;
revoke all on function public.delete_route_stop(uuid,uuid) from public;
grant execute on function public.create_route_stop(uuid,text,text,text,date,date,text,text,uuid) to authenticated;
grant execute on function public.reorder_route_stops(uuid,uuid[]) to authenticated;
grant execute on function public.delete_route_stop(uuid,uuid) to authenticated;

commit;
