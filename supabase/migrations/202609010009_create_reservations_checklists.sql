-- Triply — Module 07: Reservations & Checklists
begin;
create type public.reservation_type as enum('accommodation','restaurant','attraction_activity','event','rental','transfer','transport_reference','other');
create type public.reservation_status as enum('planned','booked','cancelled','completed');
create type public.checklist_category as enum('booking','documents','money','packing','health_safety','connectivity','transport','accommodation','activities','other');

create table public.reservations(
 id uuid primary key default gen_random_uuid(),trip_id uuid not null references public.trips(id) on delete cascade,
 title text not null,type public.reservation_type not null,status public.reservation_status not null default 'planned',
 stop_id uuid,itinerary_item_id uuid,travel_leg_id uuid,cost_item_id uuid,provider text,confirmation_code text,booking_url text,
 provider_phone text,provider_email text,start_local_date date,start_local_time time,end_local_date date,end_local_time time,timezone text,
 location_text text,cancellation_deadline date,free_cancellation boolean,cancellation_notes text,notes text,needs_review boolean not null default false,
 cancelled_at timestamptz,archived_at timestamptz,create_request_id uuid not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 constraint reservations_id_trip_unique unique(id,trip_id),constraint reservations_request_unique unique(trip_id,create_request_id),
 constraint reservations_title_check check(char_length(trim(title)) between 1 and 120),
 constraint reservations_text_check check((provider is null or char_length(provider)<=160) and (confirmation_code is null or char_length(confirmation_code)<=160) and (notes is null or char_length(notes)<=4000) and (cancellation_notes is null or char_length(cancellation_notes)<=2000)),
 constraint reservations_url_check check(booking_url is null or booking_url ~ '^https?://'),
 constraint reservations_date_check check(end_local_date is null or (start_local_date is not null and end_local_date>=start_local_date)),
 constraint reservations_time_check check((start_local_time is null and end_local_time is null and timezone is null) or (start_local_time is not null and timezone is not null and (end_local_time is null or end_local_date is not null or end_local_time>=start_local_time))),
 constraint reservations_stop_fk foreign key(stop_id,trip_id) references public.stops(id,trip_id) on delete restrict,
 constraint reservations_itinerary_fk foreign key(itinerary_item_id,trip_id) references public.itinerary_items(id,trip_id) on delete restrict,
 constraint reservations_leg_fk foreign key(travel_leg_id,trip_id) references public.travel_legs(id,trip_id) on delete restrict,
 constraint reservations_cost_fk foreign key(cost_item_id,trip_id) references public.cost_items(id,trip_id) on delete restrict
);
create table public.checklist_items(
 id uuid primary key default gen_random_uuid(),trip_id uuid not null references public.trips(id) on delete cascade,stop_id uuid,title text not null,
 notes text,category public.checklist_category not null default 'other',due_date date,sort_order integer not null,is_completed boolean not null default false,
 completed_at timestamptz,needs_review boolean not null default false,template_key text,create_request_id uuid not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 constraint checklist_items_request_unique unique(trip_id,create_request_id),constraint checklist_title_check check(char_length(trim(title)) between 1 and 160),
 constraint checklist_notes_check check(notes is null or char_length(notes)<=4000),constraint checklist_sort_check check(sort_order>=0),
 constraint checklist_completion_check check((is_completed and completed_at is not null) or (not is_completed and completed_at is null)),
 constraint checklist_stop_fk foreign key(stop_id,trip_id) references public.stops(id,trip_id) on delete restrict
);
create unique index checklist_template_unique on public.checklist_items(trip_id,template_key) where template_key is not null;
create index reservations_trip_status_date_idx on public.reservations(trip_id,status,start_local_date,type) where archived_at is null;
create index reservations_trip_stop_idx on public.reservations(trip_id,stop_id) where stop_id is not null;
create index checklist_trip_order_idx on public.checklist_items(trip_id,is_completed,sort_order,id);
create index checklist_trip_due_idx on public.checklist_items(trip_id,due_date) where not is_completed;
create trigger reservations_set_updated_at before update on public.reservations for each row execute function public.set_updated_at();
create trigger checklist_items_set_updated_at before update on public.checklist_items for each row execute function public.set_updated_at();

create or replace function public.validate_reservation() returns trigger language plpgsql security invoker set search_path='' as $$
declare v_start date;v_end date;v_stop_start date;v_stop_end date;
begin
 select start_date,end_date into v_start,v_end from public.trips where id=new.trip_id;if v_start is null then raise exception 'trip_not_available';end if;
 if new.timezone is not null and not exists(select 1 from pg_catalog.pg_timezone_names where name=new.timezone) then raise exception 'invalid_reservation_timezone';end if;
 if new.start_local_date is not null and not new.needs_review and (new.start_local_date<v_start or new.start_local_date>v_end) then raise exception 'reservation_outside_trip';end if;
 if new.stop_id is not null then select arrival_date,departure_date into v_stop_start,v_stop_end from public.stops where id=new.stop_id and trip_id=new.trip_id;if v_stop_start is null then raise exception 'stop_not_available';end if;if new.start_local_date is not null and not new.needs_review and (new.start_local_date<v_stop_start or new.start_local_date>v_stop_end) then raise exception 'reservation_outside_stop';end if;end if;
 if new.status='cancelled' and new.cancelled_at is null then new.cancelled_at=now();end if;return new;
end;$$;
create trigger reservations_validate before insert or update on public.reservations for each row execute function public.validate_reservation();

create or replace function public.validate_checklist_item() returns trigger language plpgsql security invoker set search_path='' as $$ begin
 if new.stop_id is not null and not exists(select 1 from public.stops where id=new.stop_id and trip_id=new.trip_id) then raise exception 'stop_not_available';end if;
 if new.is_completed and new.completed_at is null then new.completed_at=now();elsif not new.is_completed then new.completed_at=null;end if;return new;end;$$;
create trigger checklist_items_validate before insert or update on public.checklist_items for each row execute function public.validate_checklist_item();

create or replace function public.add_starter_checklist(p_trip_id uuid) returns integer language plpgsql security invoker set search_path='' as $$
declare v_inserted integer;
begin perform 1 from public.trips where id=p_trip_id and user_id=(select auth.uid()) for update;if not found then raise exception 'trip_not_available';end if;
 insert into public.checklist_items(trip_id,title,category,sort_order,template_key,create_request_id) values
 (p_trip_id,'Verificar validade do passaporte/identificação','documents',1000,'passport',gen_random_uuid()),(p_trip_id,'Verificar requisitos de visto e entrada','documents',2000,'visa',gen_random_uuid()),
 (p_trip_id,'Comprar seguro de viagem','health_safety',3000,'insurance',gen_random_uuid()),(p_trip_id,'Confirmar alojamento','accommodation',4000,'accommodation',gen_random_uuid()),
 (p_trip_id,'Confirmar transportes','transport',5000,'transport',gen_random_uuid()),(p_trip_id,'Verificar dados móveis/eSIM','connectivity',6000,'connectivity',gen_random_uuid()),
 (p_trip_id,'Preparar métodos de pagamento','money',7000,'payment',gen_random_uuid()),(p_trip_id,'Descarregar reservas/documentos importantes','booking',8000,'downloads',gen_random_uuid()) on conflict do nothing;
 get diagnostics v_inserted=row_count;return v_inserted;end;$$;
create or replace function public.reorder_checklist(p_trip_id uuid,p_item_ids uuid[]) returns void language plpgsql security invoker set search_path='' as $$
declare v_count integer;begin perform 1 from public.trips where id=p_trip_id and user_id=(select auth.uid()) for update;if not found then raise exception 'trip_not_available';end if;
 select count(*) into v_count from public.checklist_items where trip_id=p_trip_id;if coalesce(array_length(p_item_ids,1),0)<>v_count or (select count(distinct value) from unnest(p_item_ids)value)<>v_count then raise exception 'invalid_checklist_sequence';end if;
 update public.checklist_items item set sort_order=sequence.ordinality*1000 from unnest(p_item_ids) with ordinality sequence(id,ordinality) where item.id=sequence.id and item.trip_id=p_trip_id;if not found then raise exception 'invalid_checklist_sequence';end if;end;$$;

create or replace function public.flag_reservations_after_context_change() returns trigger language plpgsql security invoker set search_path='' as $$ begin
 if tg_table_name='trips' then update public.reservations set needs_review=true where trip_id=new.id and start_local_date is not null and (start_local_date<new.start_date or start_local_date>new.end_date);
 else update public.reservations set needs_review=true where trip_id=new.trip_id and stop_id=new.id and start_local_date is not null and (start_local_date<new.arrival_date or start_local_date>new.departure_date);end if;return new;end;$$;
create trigger trips_flag_reservations after update of start_date,end_date on public.trips for each row execute function public.flag_reservations_after_context_change();
create trigger stops_flag_reservations after update of arrival_date,departure_date on public.stops for each row execute function public.flag_reservations_after_context_change();

create or replace function public.detach_planning_context_before_delete() returns trigger language plpgsql security invoker set search_path='' as $$ begin
 if tg_table_name='stops' then update public.reservations set stop_id=null,needs_review=true where stop_id=old.id and trip_id=old.trip_id;update public.checklist_items set stop_id=null,needs_review=true where stop_id=old.id and trip_id=old.trip_id;
 elsif tg_table_name='itinerary_items' then update public.reservations set itinerary_item_id=null,needs_review=true where itinerary_item_id=old.id and trip_id=old.trip_id;
 elsif tg_table_name='travel_legs' then update public.reservations set travel_leg_id=null,needs_review=true where travel_leg_id=old.id and trip_id=old.trip_id;end if;return old;end;$$;
create trigger stops_detach_planning before delete on public.stops for each row execute function public.detach_planning_context_before_delete();
create trigger itinerary_detach_planning before delete on public.itinerary_items for each row execute function public.detach_planning_context_before_delete();
create trigger legs_detach_planning before delete on public.travel_legs for each row execute function public.detach_planning_context_before_delete();

alter table public.reservations enable row level security;alter table public.checklist_items enable row level security;
revoke all on public.reservations,public.checklist_items from anon,authenticated;grant select,insert,update,delete on public.reservations,public.checklist_items to authenticated;
create policy "reservations_owner_all" on public.reservations for all to authenticated using(exists(select 1 from public.trips where trips.id=reservations.trip_id and trips.user_id=(select auth.uid()))) with check(exists(select 1 from public.trips where trips.id=reservations.trip_id and trips.user_id=(select auth.uid())));
create policy "checklist_owner_all" on public.checklist_items for all to authenticated using(exists(select 1 from public.trips where trips.id=checklist_items.trip_id and trips.user_id=(select auth.uid()))) with check(exists(select 1 from public.trips where trips.id=checklist_items.trip_id and trips.user_id=(select auth.uid())));
revoke all on function public.add_starter_checklist(uuid) from public;revoke all on function public.reorder_checklist(uuid,uuid[]) from public;grant execute on function public.add_starter_checklist(uuid) to authenticated;grant execute on function public.reorder_checklist(uuid,uuid[]) to authenticated;
commit;
