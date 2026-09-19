-- Triply — Module 08: private Documents
begin;
create type public.travel_document_type as enum('passport','national_id','visa','travel_insurance','health_document','ticket_or_boarding_pass','accommodation_voucher','reservation_voucher','driver_document','rental_document','other');
create table public.travel_documents(
 id uuid primary key default gen_random_uuid(),trip_id uuid not null references public.trips(id) on delete cascade,type public.travel_document_type not null,title text not null,
 holder_label text,stop_id uuid,reservation_id uuid,travel_leg_id uuid,issue_date date,expiry_date date,notes text,needs_review boolean not null default false,
 attachment_path text,attachment_name text,attachment_mime text,attachment_size bigint,create_request_id uuid not null,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 constraint travel_documents_id_trip_unique unique(id,trip_id),constraint travel_documents_request_unique unique(trip_id,create_request_id),
 constraint travel_documents_title_check check(char_length(trim(title)) between 1 and 160),constraint travel_documents_holder_check check(holder_label is null or char_length(trim(holder_label)) between 1 and 120),
 constraint travel_documents_notes_check check(notes is null or char_length(notes)<=4000),constraint travel_documents_dates_check check(expiry_date is null or issue_date is null or expiry_date>=issue_date),
 constraint travel_documents_attachment_check check((attachment_path is null and attachment_name is null and attachment_mime is null and attachment_size is null) or (attachment_path is not null and attachment_name is not null and attachment_mime in('application/pdf','image/jpeg','image/png','image/webp') and attachment_size between 1 and 10485760)),
 constraint travel_documents_stop_fk foreign key(stop_id,trip_id) references public.stops(id,trip_id) on delete restrict,
 constraint travel_documents_reservation_fk foreign key(reservation_id,trip_id) references public.reservations(id,trip_id) on delete restrict,
 constraint travel_documents_leg_fk foreign key(travel_leg_id,trip_id) references public.travel_legs(id,trip_id) on delete restrict
);
create index travel_documents_trip_type_expiry_idx on public.travel_documents(trip_id,type,expiry_date,updated_at desc);
create index travel_documents_trip_holder_idx on public.travel_documents(trip_id,lower(holder_label)) where holder_label is not null;
create trigger travel_documents_set_updated_at before update on public.travel_documents for each row execute function public.set_updated_at();
create or replace function public.validate_travel_document() returns trigger language plpgsql security invoker set search_path='' as $$ begin
 if new.stop_id is not null and not exists(select 1 from public.stops where id=new.stop_id and trip_id=new.trip_id) then raise exception 'stop_not_available';end if;
 if new.reservation_id is not null and not exists(select 1 from public.reservations where id=new.reservation_id and trip_id=new.trip_id) then raise exception 'reservation_not_available';end if;
 if new.travel_leg_id is not null and not exists(select 1 from public.travel_legs where id=new.travel_leg_id and trip_id=new.trip_id) then raise exception 'leg_not_available';end if;return new;end;$$;
create trigger travel_documents_validate before insert or update on public.travel_documents for each row execute function public.validate_travel_document();
create or replace function public.detach_documents_before_context_delete() returns trigger language plpgsql security invoker set search_path='' as $$ begin
 if tg_table_name='stops' then update public.travel_documents set stop_id=null,needs_review=true where stop_id=old.id and trip_id=old.trip_id;
 elsif tg_table_name='reservations' then update public.travel_documents set reservation_id=null,needs_review=true where reservation_id=old.id and trip_id=old.trip_id;
 elsif tg_table_name='travel_legs' then update public.travel_documents set travel_leg_id=null,needs_review=true where travel_leg_id=old.id and trip_id=old.trip_id;end if;return old;end;$$;
create trigger stops_detach_documents before delete on public.stops for each row execute function public.detach_documents_before_context_delete();
create trigger reservations_detach_documents before delete on public.reservations for each row execute function public.detach_documents_before_context_delete();
create trigger legs_detach_documents before delete on public.travel_legs for each row execute function public.detach_documents_before_context_delete();
alter table public.travel_documents enable row level security;revoke all on public.travel_documents from anon,authenticated;grant select,insert,update,delete on public.travel_documents to authenticated;
create policy "travel_documents_owner_all" on public.travel_documents for all to authenticated using(exists(select 1 from public.trips where trips.id=travel_documents.trip_id and trips.user_id=(select auth.uid()))) with check(exists(select 1 from public.trips where trips.id=travel_documents.trip_id and trips.user_id=(select auth.uid())));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('trip-documents','trip-documents',false,10485760,array['application/pdf','image/jpeg','image/png','image/webp']) on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;
create policy "document_objects_owner_select" on storage.objects for select to authenticated using(bucket_id='trip-documents' and exists(select 1 from public.travel_documents d join public.trips t on t.id=d.trip_id where d.attachment_path=name and t.user_id=(select auth.uid())));
create policy "document_objects_owner_insert" on storage.objects for insert to authenticated with check(bucket_id='trip-documents' and (storage.foldername(name))[1]=(select auth.uid())::text and exists(select 1 from public.travel_documents d join public.trips t on t.id=d.trip_id where d.id::text=(storage.foldername(name))[3] and d.trip_id::text=(storage.foldername(name))[2] and t.user_id=(select auth.uid())));
create policy "document_objects_owner_delete" on storage.objects for delete to authenticated using(bucket_id='trip-documents' and ((storage.foldername(name))[1]=(select auth.uid())::text));
commit;
