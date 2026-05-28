alter table public.events
add column if not exists price_type text not null default 'free';

alter table public.events
add column if not exists price_text text;

alter table public.events
add column if not exists is_online boolean not null default false;

alter table public.events
drop constraint if exists events_price_type_check;

alter table public.events
add constraint events_price_type_check
check (price_type in ('free', 'paid'));

alter table public.events
drop constraint if exists events_price_text_check;

alter table public.events
add constraint events_price_text_check
check (
  price_type = 'paid'
  or price_text is null
);

create index if not exists events_price_type_idx
on public.events(price_type);

create index if not exists events_is_online_idx
on public.events(is_online);
