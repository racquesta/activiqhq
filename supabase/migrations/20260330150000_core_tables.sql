-- ActiviqHQ core schema (Postgres 15+ / Supabase).
-- Requires Supabase auth schema for profiles → auth.users FK.
-- Portable: gen_random_uuid(), citext; avoid Supabase-only table features in public schema.

create extension if not exists citext with schema public;

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  enrollment_policy text not null default 'multiple'
    check (enrollment_policy in ('single_active', 'multiple')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- org_memberships
-- ---------------------------------------------------------------------------
create table public.org_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  staff_role text
    check (staff_role is null or staff_role in ('owner', 'admin', 'instructor', 'coach')),
  staff_label text,
  is_parent boolean not null default false,
  permissions jsonb,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id),
  check (
    staff_role is not null
    or is_parent = true
  )
);

create index org_memberships_user_idx on public.org_memberships (user_id);
create index org_memberships_org_idx on public.org_memberships (organization_id);

-- ---------------------------------------------------------------------------
-- invitations (staff)
-- ---------------------------------------------------------------------------
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email citext not null,
  intended_staff_role text not null
    check (intended_staff_role in ('owner', 'admin', 'instructor', 'coach')),
  intended_staff_label text,
  token text not null unique,
  expires_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index invitations_org_email_idx on public.invitations (organization_id, email);

-- ---------------------------------------------------------------------------
-- facilities
-- ---------------------------------------------------------------------------
create table public.facilities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index facilities_org_idx on public.facilities (organization_id);

-- ---------------------------------------------------------------------------
-- activities
-- ---------------------------------------------------------------------------
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  description text,
  activity_kind text,
  capacity int,
  min_age int,
  max_age int,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  check (
    min_age is null
    or max_age is null
    or min_age <= max_age
  )
);

create index activities_org_published_idx on public.activities (organization_id, published);

-- ---------------------------------------------------------------------------
-- activity_sessions
-- ---------------------------------------------------------------------------
create table public.activity_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  activity_id uuid not null references public.activities (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  check (starts_at < ends_at)
);

create index activity_sessions_activity_idx on public.activity_sessions (activity_id);
create index activity_sessions_org_start_idx on public.activity_sessions (organization_id, starts_at);

-- ---------------------------------------------------------------------------
-- facility_bookings (hard-block overlaps enforced in app + index for queries)
-- ---------------------------------------------------------------------------
create table public.facility_bookings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  facility_id uuid not null references public.facilities (id) on delete cascade,
  activity_session_id uuid not null unique references public.activity_sessions (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  check (starts_at < ends_at)
);

create index facility_bookings_facility_time_idx on public.facility_bookings (facility_id, starts_at, ends_at);

-- ---------------------------------------------------------------------------
-- children
-- ---------------------------------------------------------------------------
create table public.children (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  guardian_user_id uuid not null references public.profiles (id) on delete cascade,
  first_name text not null,
  birth_date date not null,
  created_at timestamptz not null default now()
);

create index children_guardian_org_idx on public.children (guardian_user_id, organization_id);

-- ---------------------------------------------------------------------------
-- enrollments
-- ---------------------------------------------------------------------------
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  activity_id uuid not null references public.activities (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'cancelled')),
  created_at timestamptz not null default now(),
  unique (child_id, activity_id)
);

create index enrollments_org_activity_idx on public.enrollments (organization_id, activity_id);

-- ---------------------------------------------------------------------------
-- waitlist_entries
-- ---------------------------------------------------------------------------
create table public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  child_id uuid not null references public.children (id) on delete cascade,
  activity_id uuid not null references public.activities (id) on delete cascade,
  position int not null,
  status text not null default 'waiting'
    check (status in ('waiting', 'offered', 'expired', 'enrolled')),
  offered_at timestamptz,
  offer_expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (activity_id, position),
  unique (child_id, activity_id)
);

create index waitlist_entries_activity_status_idx on public.waitlist_entries (activity_id, status, position);

-- ---------------------------------------------------------------------------
-- audit_logs (minimal FR-014 footprint)
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  actor_user_id uuid not null references public.profiles (id) on delete restrict,
  action text not null,
  entity text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_org_created_idx on public.audit_logs (organization_id, created_at desc);

-- RLS: enable + policies in a later migration (implement phase). Enabling without policies
-- blocks all anon/authenticated access; ship multi-tenant policies before production.
