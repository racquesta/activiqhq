-- T008: Row Level Security and tenant-isolation policies.

create or replace function public.is_org_member(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = target_org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  )
  or exists (
    select 1
    from public.guardian_memberships g
    where g.organization_id = target_org_id
      and g.user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(target_org_id uuid, allowed_roles public.membership_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = target_org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = any(allowed_roles)
  );
$$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.invites enable row level security;
alter table public.guardian_memberships enable row level security;
alter table public.child_profiles enable row level security;
alter table public.activities enable row level security;
alter table public.enrollments enable row level security;
alter table public.role_templates enable row level security;
alter table public.enrollment_policies enable row level security;

-- organizations
drop policy if exists organizations_select_member on public.organizations;
create policy organizations_select_member
on public.organizations
for select
using (public.is_org_member(id));

drop policy if exists organizations_insert_authenticated on public.organizations;
create policy organizations_insert_authenticated
on public.organizations
for insert
with check (auth.uid() = created_by_user_id);

drop policy if exists organizations_update_owner_admin on public.organizations;
create policy organizations_update_owner_admin
on public.organizations
for update
using (public.has_org_role(id, array['owner'::public.membership_role, 'admin'::public.membership_role]))
with check (public.has_org_role(id, array['owner'::public.membership_role, 'admin'::public.membership_role]));

-- profiles
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self
on public.profiles
for select
using (user_id = auth.uid());

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self
on public.profiles
for insert
with check (user_id = auth.uid());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
on public.profiles
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- organization_memberships
drop policy if exists memberships_select_member on public.organization_memberships;
create policy memberships_select_member
on public.organization_memberships
for select
using (
  public.has_org_role(
    organization_id,
    array[
      'owner'::public.membership_role,
      'admin'::public.membership_role,
      'instructor'::public.membership_role,
      'coach'::public.membership_role
    ]
  )
  or user_id = auth.uid()
);

drop policy if exists memberships_insert_owner_admin on public.organization_memberships;
create policy memberships_insert_owner_admin
on public.organization_memberships
for insert
with check (public.has_org_role(organization_id, array['owner'::public.membership_role, 'admin'::public.membership_role]));

drop policy if exists memberships_update_owner_admin on public.organization_memberships;
create policy memberships_update_owner_admin
on public.organization_memberships
for update
using (public.has_org_role(organization_id, array['owner'::public.membership_role, 'admin'::public.membership_role]))
with check (public.has_org_role(organization_id, array['owner'::public.membership_role, 'admin'::public.membership_role]));

-- invites
drop policy if exists invites_select_owner_admin on public.invites;
create policy invites_select_owner_admin
on public.invites
for select
using (public.has_org_role(organization_id, array['owner'::public.membership_role, 'admin'::public.membership_role]));

drop policy if exists invites_insert_owner_admin on public.invites;
create policy invites_insert_owner_admin
on public.invites
for insert
with check (
  public.has_org_role(organization_id, array['owner'::public.membership_role, 'admin'::public.membership_role])
  and invited_by_user_id = auth.uid()
);

drop policy if exists invites_update_owner_admin on public.invites;
create policy invites_update_owner_admin
on public.invites
for update
using (public.has_org_role(organization_id, array['owner'::public.membership_role, 'admin'::public.membership_role]))
with check (public.has_org_role(organization_id, array['owner'::public.membership_role, 'admin'::public.membership_role]));

-- guardian_memberships
drop policy if exists guardian_memberships_select_member on public.guardian_memberships;
create policy guardian_memberships_select_member
on public.guardian_memberships
for select
using (public.is_org_member(organization_id));

drop policy if exists guardian_memberships_insert_self_or_admin on public.guardian_memberships;
create policy guardian_memberships_insert_self_or_admin
on public.guardian_memberships
for insert
with check (
  user_id = auth.uid()
  or public.has_org_role(organization_id, array['owner'::public.membership_role, 'admin'::public.membership_role])
);

-- child_profiles
drop policy if exists child_profiles_select_org_member on public.child_profiles;
drop policy if exists child_profiles_select_staff_or_self on public.child_profiles;
create policy child_profiles_select_staff_or_self
on public.child_profiles
for select
using (
  public.has_org_role(
    organization_id,
    array[
      'owner'::public.membership_role,
      'admin'::public.membership_role,
      'instructor'::public.membership_role,
      'coach'::public.membership_role
    ]
  )
  or guardian_user_id = auth.uid()
);

drop policy if exists child_profiles_insert_guardian_or_admin on public.child_profiles;
create policy child_profiles_insert_guardian_or_admin
on public.child_profiles
for insert
with check (
  (guardian_user_id = auth.uid() and public.is_org_member(organization_id))
  or public.has_org_role(organization_id, array['owner'::public.membership_role, 'admin'::public.membership_role])
);

drop policy if exists child_profiles_update_guardian_or_admin on public.child_profiles;
create policy child_profiles_update_guardian_or_admin
on public.child_profiles
for update
using (
  guardian_user_id = auth.uid()
  or public.has_org_role(organization_id, array['owner'::public.membership_role, 'admin'::public.membership_role])
)
with check (
  guardian_user_id = auth.uid()
  or public.has_org_role(organization_id, array['owner'::public.membership_role, 'admin'::public.membership_role])
);

-- activities
drop policy if exists activities_select_org_member on public.activities;
create policy activities_select_org_member
on public.activities
for select
using (public.is_org_member(organization_id));

drop policy if exists activities_insert_staff on public.activities;
drop policy if exists activities_insert_owner_admin on public.activities;
create policy activities_insert_owner_admin
on public.activities
for insert
with check (
  public.has_org_role(organization_id, array['owner'::public.membership_role, 'admin'::public.membership_role])
);

drop policy if exists activities_update_staff on public.activities;
drop policy if exists activities_update_owner_admin on public.activities;
create policy activities_update_owner_admin
on public.activities
for update
using (
  public.has_org_role(organization_id, array['owner'::public.membership_role, 'admin'::public.membership_role])
)
with check (
  public.has_org_role(organization_id, array['owner'::public.membership_role, 'admin'::public.membership_role])
);

-- enrollments
drop policy if exists enrollments_select_org_member on public.enrollments;
drop policy if exists enrollments_select_staff_or_guardian_own_children on public.enrollments;
create policy enrollments_select_staff_or_guardian_own_children
on public.enrollments
for select
using (
  public.has_org_role(
    organization_id,
    array[
      'owner'::public.membership_role,
      'admin'::public.membership_role,
      'instructor'::public.membership_role,
      'coach'::public.membership_role
    ]
  )
  or exists (
    select 1
    from public.child_profiles c
    where c.id = child_id
      and c.organization_id = organization_id
      and c.guardian_user_id = auth.uid()
  )
);

drop policy if exists enrollments_insert_guardian_or_admin on public.enrollments;
create policy enrollments_insert_guardian_or_admin
on public.enrollments
for insert
with check (
  public.has_org_role(organization_id, array['owner'::public.membership_role, 'admin'::public.membership_role])
  or exists (
    select 1
    from public.child_profiles c
    where c.id = child_id
      and c.organization_id = enrollments.organization_id
      and c.guardian_user_id = auth.uid()
  )
);

drop policy if exists enrollments_update_guardian_or_admin on public.enrollments;
create policy enrollments_update_guardian_or_admin
on public.enrollments
for update
using (
  public.has_org_role(organization_id, array['owner'::public.membership_role, 'admin'::public.membership_role])
  or exists (
    select 1
    from public.child_profiles c
    where c.id = child_id
      and c.organization_id = enrollments.organization_id
      and c.guardian_user_id = auth.uid()
  )
)
with check (
  public.has_org_role(organization_id, array['owner'::public.membership_role, 'admin'::public.membership_role])
  or exists (
    select 1
    from public.child_profiles c
    where c.id = child_id
      and c.organization_id = enrollments.organization_id
      and c.guardian_user_id = auth.uid()
  )
);

-- role_templates
drop policy if exists role_templates_select_org_member on public.role_templates;
create policy role_templates_select_org_member
on public.role_templates
for select
using (public.is_org_member(organization_id));

drop policy if exists role_templates_mutate_owner_admin on public.role_templates;
create policy role_templates_mutate_owner_admin
on public.role_templates
for all
using (public.has_org_role(organization_id, array['owner'::public.membership_role, 'admin'::public.membership_role]))
with check (public.has_org_role(organization_id, array['owner'::public.membership_role, 'admin'::public.membership_role]));

-- enrollment_policies
drop policy if exists enrollment_policies_select_org_member on public.enrollment_policies;
create policy enrollment_policies_select_org_member
on public.enrollment_policies
for select
using (public.is_org_member(organization_id));

drop policy if exists enrollment_policies_mutate_owner_admin on public.enrollment_policies;
create policy enrollment_policies_mutate_owner_admin
on public.enrollment_policies
for all
using (public.has_org_role(organization_id, array['owner'::public.membership_role, 'admin'::public.membership_role]))
with check (public.has_org_role(organization_id, array['owner'::public.membership_role, 'admin'::public.membership_role]));
