-- =========================================
-- RESET PUBLIC SCHEMA
-- =========================================

drop schema if exists public cascade;

create schema public;

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;
grant all on all tables in schema public to postgres, anon, authenticated, service_role;
grant all on all routines in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;

alter default privileges in schema public
grant all on tables to postgres, anon, authenticated, service_role;

alter default privileges in schema public
grant all on routines to postgres, anon, authenticated, service_role;

alter default privileges in schema public
grant all on sequences to postgres, anon, authenticated, service_role;


-- =========================================
-- TYPES
-- =========================================

create type public.user_role as enum ('user', 'admin');

create type public.event_status as enum ('published', 'archived');

create type public.event_cta_type as enum (
  'external_link',
  'whatsapp',
  'phone',
  'none'
);


-- =========================================
-- TABLE: PROFILES
-- =========================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  full_name text,
  avatar_url text,

  role public.user_role not null default 'user',

  created_at timestamptz not null default now()
);


-- =========================================
-- TABLE: CATEGORIES
-- =========================================

create table public.categories (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  slug text not null unique
);


-- =========================================
-- TABLE: EVENTS
-- =========================================

create table public.events (
  id uuid primary key default gen_random_uuid(),

  created_by uuid references public.profiles(id) on delete set null,

  category_id uuid not null references public.categories(id) on delete restrict,

  title text not null,
  slug text not null unique,
  description text,

  city text not null,
  country_code text,
  location text,

  price_type text not null default 'free',
  price_text text,
  is_online boolean not null default false,

  starts_at timestamptz not null,
  ends_at timestamptz,

  cover_image_url text,
  images text[] not null default '{}',

  cta_type public.event_cta_type not null default 'none',
  cta_label text,
  cta_url text,
  cta_phone text,

  status public.event_status not null default 'published',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint events_dates_check check (
    ends_at is null or ends_at >= starts_at
  ),

  constraint events_country_code_check check (
    country_code is null
    or country_code ~ '^[A-Z]{2}$'
  ),

  constraint events_price_type_check check (
    price_type in ('free', 'paid')
  ),

  constraint events_price_text_check check (
    price_type = 'paid'
    or price_text is null
  ),

  constraint events_cta_external_link_check check (
    cta_type != 'external_link'
    or cta_url is not null
  ),

  constraint events_cta_whatsapp_check check (
    cta_type != 'whatsapp'
    or cta_phone is not null
  ),

  constraint events_cta_phone_check check (
    cta_type != 'phone'
    or cta_phone is not null
  )
);


-- =========================================
-- TABLE: NEWS
-- =========================================

create table public.news (
  id uuid primary key default gen_random_uuid(),

  created_by uuid references public.profiles(id) on delete set null,

  title text not null,
  slug text not null unique,
  description text,

  image_url text,
  link_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- =========================================
-- UPDATED_AT TRIGGER FUNCTION
-- =========================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_events_updated_at
before update on public.events
for each row execute function public.set_updated_at();

create trigger set_news_updated_at
before update on public.news
for each row execute function public.set_updated_at();


-- =========================================
-- AUTO CREATE PROFILE AFTER SIGNUP
-- =========================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    avatar_url
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();


-- =========================================
-- ADMIN HELPER
-- =========================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$;


-- =========================================
-- ENABLE RLS
-- =========================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.events enable row level security;
alter table public.news enable row level security;


-- =========================================
-- RLS: PROFILES
-- =========================================

create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (
  auth.uid() = id
  and role = (
    select role
    from public.profiles
    where id = auth.uid()
  )
);

create policy "Admins can read all profiles"
on public.profiles
for select
to authenticated
using (public.is_admin());

create policy "Admins can update all profiles"
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- =========================================
-- RLS: CATEGORIES
-- =========================================

create policy "Anyone can read categories"
on public.categories
for select
using (true);

create policy "Admins can manage categories"
on public.categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- =========================================
-- RLS: EVENTS
-- =========================================

create policy "Anyone can read published events"
on public.events
for select
using (status = 'published');

create policy "Admins can manage all events"
on public.events
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- =========================================
-- RLS: NEWS
-- =========================================

create policy "Anyone can read news"
on public.news
for select
using (true);

create policy "Admins can manage all news"
on public.news
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- =========================================
-- INDEXES
-- =========================================

create index events_status_starts_at_idx on public.events(status, starts_at);
create index events_city_idx on public.events(city);
create index events_country_code_idx on public.events(country_code);
create index events_category_id_idx on public.events(category_id);
create index events_starts_at_idx on public.events(starts_at);
create index events_price_type_idx on public.events(price_type);
create index events_is_online_idx on public.events(is_online);


-- =========================================
-- STORAGE: EVENT IMAGES
-- =========================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'event-images',
  'event-images',
  true,
  5242880,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can read event images"
on storage.objects;

create policy "Anyone can read event images"
on storage.objects
for select
using (bucket_id = 'event-images');

drop policy if exists "Admins can upload event images"
on storage.objects;

create policy "Admins can upload event images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'event-images'
  and public.is_admin()
);

drop policy if exists "Admins can update event images"
on storage.objects;

create policy "Admins can update event images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'event-images'
  and public.is_admin()
)
with check (
  bucket_id = 'event-images'
  and public.is_admin()
);

drop policy if exists "Admins can delete event images"
on storage.objects;

create policy "Admins can delete event images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'event-images'
  and public.is_admin()
);
