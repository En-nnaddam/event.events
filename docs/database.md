# Database Design — Events MVP

This document describes the current Supabase database setup for the Events MVP.

## MVP Direction

Current version is intentionally simple:

- Public visitors can browse/search/share events and read news.
- Admin creates and manages events, categories, and news.
- Normal users do not create events yet.
- Later, an `organizer` role can be added so organizers can submit events for admin review.

## Main Decisions

### Roles

Current roles:

```txt
user
admin
```

For now, only admins can manage event content.

Possible future roles:

```txt
organizer
```

### Event Status

Current statuses:

```txt
published
archived
```

No `draft` and no approval workflow for now because only admins create events.

Future statuses, when organizers are added:

```txt
pending_review
rejected
published
archived
```

### Categories

Events use `category_id`, not a plain `category` text field.

Reason:

- Filters stay clean.
- Category names/slugs are managed in one table.
- Renaming a category does not require updating every event.
- `category_id` is required, so events cannot exist without a category.

The relation uses `on delete restrict`, so a category cannot be deleted while events are using it.

### Event Date

`starts_at` is required and uses `timestamptz`, meaning it stores date + time + timezone.

`ends_at` is optional because many events only need a start date/time.

A constraint ensures `ends_at` is not earlier than `starts_at` when it exists.

### Event CTA

Instead of separate `booking_url` and `contact_phone`, events use flexible CTA fields:

```sql
cta_type event_cta_type not null default 'none',
cta_label text,
cta_url text,
cta_phone text
```

CTA types:

```txt
external_link
whatsapp
phone
none
```

Frontend behavior:

```txt
external_link -> href = cta_url
whatsapp      -> href = https://wa.me/cta_phone
phone         -> href = tel:cta_phone
none          -> hide CTA
```

### News Ownership

`news.created_by` uses `on delete set null`.

This means if an admin profile is deleted, the news item remains in the database.

Same for `events.created_by`: if the admin profile is deleted, events remain.

---

# Full Supabase SQL

Run this in Supabase SQL Editor.

> Warning: this resets the whole `public` schema. It deletes existing public tables, policies, functions, triggers, and types.
> It does not delete users from Supabase Auth.

```sql
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
  location text,

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

create index profiles_role_idx on public.profiles(role);

create index categories_slug_idx on public.categories(slug);

create index events_slug_idx on public.events(slug);
create index events_status_idx on public.events(status);
create index events_city_idx on public.events(city);
create index events_category_id_idx on public.events(category_id);
create index events_starts_at_idx on public.events(starts_at);
create index events_cta_type_idx on public.events(cta_type);

create index news_slug_idx on public.news(slug);
```

---

# After Signup: Make Your Account Admin

After creating your account, get your user ID from:

```txt
Supabase Dashboard -> Authentication -> Users
```

Then run:

```sql
update public.profiles
set role = 'admin'
where id = 'PUT-YOUR-USER-ID-HERE';
```

---

# Current Tables Summary

## profiles

Stores public profile data linked to `auth.users`.

Important fields:

```txt
id
full_name
avatar_url
role
created_at
```

## categories

Stores event categories.

Important fields:

```txt
id
name
slug
```

## events

Stores events created by admin.

Important fields:

```txt
id
created_by
category_id
title
slug
description
city
location
starts_at
ends_at
cover_image_url
images
cta_type
cta_label
cta_url
cta_phone
status
created_at
updated_at
```

## news

Stores simple news posts.

Important fields:

```txt
id
created_by
title
slug
description
image_url
link_url
created_at
updated_at
```

---

# Future Organizer Upgrade

When organizers are added later, update the enum:

```sql
alter type public.user_role add value 'organizer';
```

Then add new event statuses if needed:

```txt
pending_review
rejected
```

Possible organizer rules:

- Organizer can create events with `pending_review`.
- Organizer can edit own rejected or pending events.
- Admin can publish, reject, archive, or edit all events.
- Public can only read published events.

