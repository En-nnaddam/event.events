alter table public.events
add column if not exists country_code text;

alter table public.events
drop constraint if exists events_country_code_check;

alter table public.events
add constraint events_country_code_check
check (
  country_code is null
  or country_code ~ '^[A-Z]{2}$'
);

create index if not exists events_country_code_idx
on public.events(country_code);
