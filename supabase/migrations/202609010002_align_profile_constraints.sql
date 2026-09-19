-- Triply
-- Migration: align profile constraints with approved Module 01 spec

begin;

alter table public.profiles
  drop constraint if exists profiles_display_name_length_check;

alter table public.profiles
  add constraint profiles_display_name_length_check
  check (display_name is null or char_length(trim(display_name)) between 1 and 80);

commit;
