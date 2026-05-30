drop index if exists public.profiles_role_idx;
drop index if exists public.categories_slug_idx;
drop index if exists public.events_slug_idx;
drop index if exists public.events_status_idx;
drop index if exists public.events_cta_type_idx;
drop index if exists public.news_slug_idx;

create index if not exists events_status_starts_at_idx
on public.events(status, starts_at);
