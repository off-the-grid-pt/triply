-- Triply — Module 06: Daily Itinerary
begin;

create type public.itinerary_item_status as enum ('active','needs_review');

create table public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  trip_date date not null,
  stop_id uuid,
  title text not null,
  place_name text,
  start_local_time time without time zone,
  end_local_time time without time zone,
  timezone text,
  notes text,
  sort_order integer not null,
  status public.itinerary_item_status not null default 'active',
  create_request_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint itinerary_items_id_trip_unique unique (id, trip_id),
  constraint itinerary_items_request_unique unique (trip_id, create_request_id),
  constraint itinerary_items_title_check check (char_length(trim(title)) between 1 and 120),
  constraint itinerary_items_place_check check (place_name is null or char_length(trim(place_name)) between 1 and 160),
  constraint itinerary_items_notes_check check (notes is null or char_length(notes) <= 4000),
  constraint itinerary_items_sort_check check (sort_order >= 0),
  constraint itinerary_items_time_shape_check check (
    (start_local_time is null and end_local_time is null and timezone is null) or
    (start_local_time is not null and timezone is not null and (end_local_time is null or end_local_time >= start_local_time))
  ),
  constraint itinerary_items_stop_fk foreign key (stop_id, trip_id) references public.stops(id, trip_id) on delete restrict
);

create index itinerary_items_trip_day_order_idx on public.itinerary_items (trip_id, trip_date, start_local_time nulls last, sort_order, id);
create index itinerary_items_stop_review_idx on public.itinerary_items (trip_id, stop_id, status) where stop_id is not null;
create trigger itinerary_items_set_updated_at before update on public.itinerary_items for each row execute function public.set_updated_at();

create or replace function public.validate_itinerary_item() returns trigger language plpgsql security invoker set search_path = '' as $$
declare v_start date; v_end date; v_stop_start date; v_stop_end date;
begin
  select start_date,end_date into v_start,v_end from public.trips where id=new.trip_id;
  if v_start is null then raise exception 'trip_not_available'; end if;
  if new.timezone is not null and not exists (select 1 from pg_catalog.pg_timezone_names where name=new.timezone) then raise exception 'invalid_itinerary_timezone'; end if;
  if new.status='active' and (new.trip_date<v_start or new.trip_date>v_end) then raise exception 'itinerary_date_outside_trip'; end if;
  if new.stop_id is not null then
    select arrival_date,departure_date into v_stop_start,v_stop_end from public.stops where id=new.stop_id and trip_id=new.trip_id;
    if v_stop_start is null then raise exception 'stop_not_available'; end if;
    if new.status='active' and (new.trip_date<v_stop_start or new.trip_date>v_stop_end) then raise exception 'itinerary_date_outside_stop'; end if;
  end if;
  return new;
end;
$$;
create trigger itinerary_items_validate before insert or update on public.itinerary_items for each row execute function public.validate_itinerary_item();

create or replace function public.create_itinerary_item(
  p_trip_id uuid,p_trip_date date,p_stop_id uuid,p_title text,p_place_name text,
  p_start_time time,p_end_time time,p_timezone text,p_notes text,p_request_id uuid
) returns uuid language plpgsql security invoker set search_path='' as $$
declare v_id uuid;v_order integer;
begin
  perform 1 from public.trips where id=p_trip_id and user_id=(select auth.uid()) for update;
  if not found then raise exception 'trip_not_available'; end if;
  select id into v_id from public.itinerary_items where trip_id=p_trip_id and create_request_id=p_request_id;
  if v_id is not null then return v_id; end if;
  select coalesce(max(sort_order),0)+1000 into v_order from public.itinerary_items where trip_id=p_trip_id and trip_date=p_trip_date and (start_local_time is null)=(p_start_time is null);
  insert into public.itinerary_items(trip_id,trip_date,stop_id,title,place_name,start_local_time,end_local_time,timezone,notes,sort_order,create_request_id)
  values(p_trip_id,p_trip_date,p_stop_id,trim(p_title),nullif(trim(p_place_name),''),p_start_time,p_end_time,p_timezone,nullif(trim(p_notes),''),v_order,p_request_id) returning id into v_id;
  return v_id;
end;$$;

create or replace function public.reorder_untimed_itinerary(p_trip_id uuid,p_trip_date date,p_item_ids uuid[]) returns void
language plpgsql security invoker set search_path='' as $$
declare v_count integer;
begin
  perform 1 from public.trips where id=p_trip_id and user_id=(select auth.uid()) for update;
  if not found then raise exception 'trip_not_available'; end if;
  select count(*) into v_count from public.itinerary_items where trip_id=p_trip_id and trip_date=p_trip_date and start_local_time is null;
  if coalesce(array_length(p_item_ids,1),0)<>v_count or (select count(distinct value) from unnest(p_item_ids)value)<>v_count or exists(select 1 from unnest(p_item_ids)value where not exists(select 1 from public.itinerary_items where id=value and trip_id=p_trip_id and trip_date=p_trip_date and start_local_time is null)) then raise exception 'invalid_itinerary_sequence'; end if;
  update public.itinerary_items item set sort_order=sequence.ordinality*1000 from unnest(p_item_ids) with ordinality sequence(id,ordinality) where item.id=sequence.id and item.trip_id=p_trip_id;
end;$$;

create or replace function public.flag_itinerary_after_stop_change() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if new.arrival_date<>old.arrival_date or new.departure_date<>old.departure_date then update public.itinerary_items set status='needs_review' where stop_id=new.id and trip_id=new.trip_id and (trip_date<new.arrival_date or trip_date>new.departure_date); end if;
  return new;
end;$$;
create trigger stops_flag_itinerary after update of arrival_date,departure_date on public.stops for each row execute function public.flag_itinerary_after_stop_change();

create or replace function public.flag_itinerary_after_trip_change() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if new.start_date<>old.start_date or new.end_date<>old.end_date then update public.itinerary_items set status='needs_review' where trip_id=new.id and (trip_date<new.start_date or trip_date>new.end_date); end if;
  return new;
end;$$;
create trigger trips_flag_itinerary after update of start_date,end_date on public.trips for each row execute function public.flag_itinerary_after_trip_change();

create or replace function public.delete_route_stop(p_trip_id uuid,p_stop_id uuid) returns integer
language plpgsql security invoker set search_path='' as $$
declare v_position integer;v_legs integer;
begin
  perform 1 from public.trips where id=p_trip_id and user_id=(select auth.uid()) for update;
  if not found then raise exception 'trip_not_available'; end if;
  select position into v_position from public.stops where id=p_stop_id and trip_id=p_trip_id for update;
  if v_position is null then raise exception 'stop_not_available'; end if;
  update public.itinerary_items set stop_id=null,status='needs_review' where trip_id=p_trip_id and stop_id=p_stop_id;
  select count(*) into v_legs from public.travel_legs where trip_id=p_trip_id and (from_stop_id=p_stop_id or to_stop_id=p_stop_id);
  delete from public.travel_legs where trip_id=p_trip_id and (from_stop_id=p_stop_id or to_stop_id=p_stop_id);
  delete from public.stops where id=p_stop_id and trip_id=p_trip_id;
  set constraints stops_trip_position_unique deferred;
  update public.stops set position=position-1 where trip_id=p_trip_id and position>v_position;
  update public.travel_legs leg set review_required=true where leg.trip_id=p_trip_id and leg.review_required=false and not public.route_points_are_adjacent(leg.trip_id,leg.from_kind,leg.from_stop_id,leg.to_kind,leg.to_stop_id);
  return v_legs;
end;$$;

alter table public.itinerary_items enable row level security;
revoke all on public.itinerary_items from anon,authenticated;
grant select,insert,update,delete on public.itinerary_items to authenticated;
create policy "itinerary_items_owner_all" on public.itinerary_items for all to authenticated
using(exists(select 1 from public.trips where trips.id=itinerary_items.trip_id and trips.user_id=(select auth.uid())))
with check(exists(select 1 from public.trips where trips.id=itinerary_items.trip_id and trips.user_id=(select auth.uid())));

revoke all on function public.create_itinerary_item(uuid,date,uuid,text,text,time,time,text,text,uuid) from public;
revoke all on function public.reorder_untimed_itinerary(uuid,date,uuid[]) from public;
grant execute on function public.create_itinerary_item(uuid,date,uuid,text,text,time,time,text,text,uuid) to authenticated;
grant execute on function public.reorder_untimed_itinerary(uuid,date,uuid[]) to authenticated;

commit;
