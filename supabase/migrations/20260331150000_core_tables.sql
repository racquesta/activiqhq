-- T006: Core tables for ActiviqHQ MVP.
-- This migration creates the foundational relational model.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_by_user_id uuid not null references auth.users(id),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create type public.membership_role as enum ('owner', 'admin', 'instructor', 'coach', 'guardian');
create type public.membership_status as enum ('active', 'invited', 'revoked');

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.membership_role not null,
  status public.membership_status not null default 'active',
  permissions_version int not null default 1,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (organization_id, user_id)
);

create type public.invite_role as enum ('admin', 'instructor', 'coach');
create type public.invite_status as enum ('pending', 'accepted', 'expired', 'revoked');

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role public.invite_role not null,
  token_hash text not null,
  status public.invite_status not null default 'pending',
  invited_by_user_id uuid not null references auth.users(id),
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.guardian_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default timezone('utc'::text, now()),
  unique (organization_id, user_id)
);

create table if not exists public.child_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  guardian_user_id uuid not null references auth.users(id) on delete cascade,
  first_name text not null,
  birth_date date not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  activity_type text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity int,
  is_published boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  check (ends_at > starts_at),
  check (capacity is null or capacity > 0)
);

create type public.enrollment_status as enum ('active', 'cancelled');

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete cascade,
  child_id uuid not null references public.child_profiles(id) on delete cascade,
  status public.enrollment_status not null default 'active',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists enrollments_activity_child_active_idx
  on public.enrollments (activity_id, child_id)
  where status = 'active';

create index if not exists org_memberships_org_role_idx
  on public.organization_memberships (organization_id, role);

create index if not exists guardian_memberships_user_idx
  on public.guardian_memberships (user_id);

create index if not exists child_profiles_org_guardian_idx
  on public.child_profiles (organization_id, guardian_user_id);

create index if not exists child_profiles_duplicate_probe_idx
  on public.child_profiles (organization_id, first_name, birth_date);

create index if not exists activities_org_published_idx
  on public.activities (organization_id, is_published, starts_at);

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists organization_memberships_set_updated_at on public.organization_memberships;
create trigger organization_memberships_set_updated_at
before update on public.organization_memberships
for each row execute function public.set_updated_at();

drop trigger if exists child_profiles_set_updated_at on public.child_profiles;
create trigger child_profiles_set_updated_at
before update on public.child_profiles
for each row execute function public.set_updated_at();

drop trigger if exists activities_set_updated_at on public.activities;
create trigger activities_set_updated_at
before update on public.activities
for each row execute function public.set_updated_at();

drop trigger if exists enrollments_set_updated_at on public.enrollments;
create trigger enrollments_set_updated_at
before update on public.enrollments
for each row execute function public.set_updated_at();
