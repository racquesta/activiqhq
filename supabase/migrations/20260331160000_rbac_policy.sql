-- T007: Role template and organization enrollment policy tables.

create table if not exists public.role_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role public.membership_role not null,
  can_manage_activities boolean not null default false,
  can_manage_enrollments boolean not null default false,
  can_manage_staff boolean not null default false,
  updated_by_user_id uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (organization_id, role),
  check (role in ('admin', 'instructor', 'coach'))
);

create table if not exists public.enrollment_policies (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  max_concurrent_activities_per_child integer not null default 1,
  updated_by_user_id uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  check (max_concurrent_activities_per_child >= 1)
);

create index if not exists role_templates_org_idx
  on public.role_templates (organization_id);

drop trigger if exists role_templates_set_updated_at on public.role_templates;
create trigger role_templates_set_updated_at
before update on public.role_templates
for each row execute function public.set_updated_at();

drop trigger if exists enrollment_policies_set_updated_at on public.enrollment_policies;
create trigger enrollment_policies_set_updated_at
before update on public.enrollment_policies
for each row execute function public.set_updated_at();
