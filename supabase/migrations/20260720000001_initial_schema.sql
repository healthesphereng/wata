-- Wata initial schema: families, members, children, and the unified events table.
-- See docs/ARCHITECTURE.md §2. RLS lives in the next migration.

-- ---------- profiles ----------
-- One row per auth user, auto-created on signup (see trigger below).
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- ---------- families ----------
create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My family',
  created_at timestamptz not null default now()
);

-- ---------- family_members ----------
create type public.family_role as enum ('owner', 'caregiver');

create table public.family_members (
  family_id uuid not null references public.families (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.family_role not null default 'caregiver',
  joined_at timestamptz not null default now(),
  primary key (family_id, user_id)
);

create index family_members_user_idx on public.family_members (user_id);

-- ---------- children ----------
create table public.children (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  name text not null,
  birth_date date,
  sex text check (sex in ('male', 'female', 'other')),
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

create index children_family_idx on public.children (family_id);

-- ---------- events ----------
-- One table for every tracker. `kind` + a per-kind zod payload in `details`
-- means new trackers (milestone, vaccine, measurement) are additive.
create type public.event_kind as enum ('feed', 'sleep', 'diaper');

create table public.events (
  id uuid primary key, -- client-generated for offline idempotency
  family_id uuid not null references public.families (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  kind public.event_kind not null,
  started_at timestamptz not null,
  ended_at timestamptz, -- null = instant event or a running timer
  details jsonb not null default '{}'::jsonb,
  note text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz -- soft delete; syncs as a tombstone
);

-- timeline / "today" for a child, newest first
create index events_child_started_idx on public.events (child_id, started_at desc);
-- incremental sync pulls per family
create index events_family_updated_idx on public.events (family_id, updated_at);

-- keep updated_at honest on every write
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_touch_updated_at
  before update on public.events
  for each row
  execute function public.touch_updated_at();

-- ---------- new-user bootstrap ----------
-- On signup: create a profile, a starter family, and an owner membership,
-- so a brand-new user can log immediately with zero setup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_family_id uuid;
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));

  insert into public.families (name)
  values ('My family')
  returning id into new_family_id;

  insert into public.family_members (family_id, user_id, role)
  values (new_family_id, new.id, 'owner');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
