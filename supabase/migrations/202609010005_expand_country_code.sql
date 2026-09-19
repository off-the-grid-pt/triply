-- Triply — approved product change: country short codes accept 2 to 4 letters.
begin;
alter table public.stops drop constraint if exists stops_country_code_check;
alter table public.stops add constraint stops_country_code_check check (country_code ~ '^[A-Z]{2,4}$');
commit;
