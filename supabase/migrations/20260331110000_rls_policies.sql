-- Row Level Security (tenant isolation). Each policy commented per constitution III.
-- Service role (SUPABASE_SERVICE_ROLE_KEY) bypasses RLS for admin migrations / server automation.

-- Helper: ids of orgs the current user belongs to.
-- (Not a function—inline in policies for clarity.)

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
alter table public.organizations enable row level security;

-- Members can read their tenant row.
create policy organizations_select_member
  on public.organizations
  for select
  to authenticated
  using (
    exists (
      select 1 from public.org_memberships m
      where m.organization_id = organizations.id
        and m.user_id = (select auth.uid())
    )
  );

-- Bootstrap: authenticated user may create an org (owner membership added in app layer).
create policy organizations_insert_authenticated
  on public.organizations
  for insert
  to authenticated
  with check ((select auth.uid()) is not null);

-- Owner or admin may update org settings.
create policy organizations_update_staff_admin
  on public.organizations
  for update
  to authenticated
  using (
    exists (
      select 1 from public.org_memberships m
      where m.organization_id = organizations.id
        and m.user_id = (select auth.uid())
        and m.staff_role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.org_memberships m
      where m.organization_id = organizations.id
        and m.user_id = (select auth.uid())
        and m.staff_role in ('owner', 'admin')
    )
  );

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- org_memberships
-- ---------------------------------------------------------------------------
alter table public.org_memberships enable row level security;

-- Users see their own membership rows; staff admins see all memberships in orgs they administer.
create policy org_memberships_select
  on public.org_memberships
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.org_memberships m
      where m.organization_id = org_memberships.organization_id
        and m.user_id = (select auth.uid())
        and m.staff_role in ('owner', 'admin')
    )
  );

-- Inserts/updates/deletes: staff admins of that org (invites, permission edits) — app enforces capability keys.
create policy org_memberships_insert_admin
  on public.org_memberships
  for insert
  to authenticated
  with check (
    -- Bootstrap: user may insert their own membership (first owner row after org create).
    user_id = (select auth.uid())
    or exists (
      select 1 from public.org_memberships m
      where m.organization_id = org_memberships.organization_id
        and m.user_id = (select auth.uid())
        and m.staff_role in ('owner', 'admin')
    )
  );

create policy org_memberships_update_admin
  on public.org_memberships
  for update
  to authenticated
  using (
    exists (
      select 1 from public.org_memberships m
      where m.organization_id = org_memberships.organization_id
        and m.user_id = (select auth.uid())
        and m.staff_role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.org_memberships m
      where m.organization_id = org_memberships.organization_id
        and m.user_id = (select auth.uid())
        and m.staff_role in ('owner', 'admin')
    )
  );

create policy org_memberships_delete_admin
  on public.org_memberships
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.org_memberships m
      where m.organization_id = org_memberships.organization_id
        and m.user_id = (select auth.uid())
        and m.staff_role in ('owner', 'admin')
    )
  );

-- ---------------------------------------------------------------------------
-- invitations
-- ---------------------------------------------------------------------------
alter table public.invitations enable row level security;

create policy invitations_all_staff_admin
  on public.invitations
  for all
  to authenticated
  using (
    exists (
      select 1 from public.org_memberships m
      where m.organization_id = invitations.organization_id
        and m.user_id = (select auth.uid())
        and m.staff_role in ('owner', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.org_memberships m
      where m.organization_id = invitations.organization_id
        and m.user_id = (select auth.uid())
        and m.staff_role in ('owner', 'admin')
    )
  );

-- ---------------------------------------------------------------------------
-- Tenant tables: facilities, activities, activity_sessions, facility_bookings,
-- children, enrollments, waitlist_entries, audit_logs
-- ---------------------------------------------------------------------------

alter table public.facilities enable row level security;

create policy facilities_staff_rw
  on public.facilities
  for all
  to authenticated
  using (
    exists (
      select 1 from public.org_memberships m
      where m.organization_id = facilities.organization_id
        and m.user_id = (select auth.uid())
        and (m.staff_role is not null)
    )
  )
  with check (
    exists (
      select 1 from public.org_memberships m
      where m.organization_id = facilities.organization_id
        and m.user_id = (select auth.uid())
        and (m.staff_role is not null)
    )
  );

alter table public.activities enable row level security;

-- Staff: full CRUD; parents: read published only (org context).
create policy activities_select_visible
  on public.activities
  for select
  to authenticated
  using (
    (
      published = true
      and exists (
        select 1 from public.org_memberships m
        where m.organization_id = activities.organization_id
          and m.user_id = (select auth.uid())
      )
    )
    or exists (
      select 1 from public.org_memberships m
      where m.organization_id = activities.organization_id
        and m.user_id = (select auth.uid())
        and m.staff_role is not null
    )
  );

create policy activities_staff_write
  on public.activities
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.org_memberships m
      where m.organization_id = activities.organization_id
        and m.user_id = (select auth.uid())
        and m.staff_role is not null
    )
  );

create policy activities_staff_update
  on public.activities
  for update
  to authenticated
  using (
    exists (
      select 1 from public.org_memberships m
      where m.organization_id = activities.organization_id
        and m.user_id = (select auth.uid())
        and m.staff_role is not null
    )
  )
  with check (
    exists (
      select 1 from public.org_memberships m
      where m.organization_id = activities.organization_id
        and m.user_id = (select auth.uid())
        and m.staff_role is not null
    )
  );

create policy activities_staff_delete
  on public.activities
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.org_memberships m
      where m.organization_id = activities.organization_id
        and m.user_id = (select auth.uid())
        and m.staff_role is not null
    )
  );

alter table public.activity_sessions enable row level security;

create policy activity_sessions_select_visible
  on public.activity_sessions
  for select
  to authenticated
  using (
    exists (
      select 1 from public.activities a
      where a.id = activity_sessions.activity_id
        and a.organization_id = activity_sessions.organization_id
        and (
          a.published = true
          or exists (
            select 1 from public.org_memberships m
            where m.organization_id = a.organization_id
              and m.user_id = (select auth.uid())
              and m.staff_role is not null
          )
        )
    )
  );

create policy activity_sessions_staff_write
  on public.activity_sessions
  for all
  to authenticated
  using (
    exists (
      select 1 from public.org_memberships m
      where m.organization_id = activity_sessions.organization_id
        and m.user_id = (select auth.uid())
        and m.staff_role is not null
    )
  )
  with check (
    exists (
      select 1 from public.org_memberships m
      where m.organization_id = activity_sessions.organization_id
        and m.user_id = (select auth.uid())
        and m.staff_role is not null
    )
  );

alter table public.facility_bookings enable row level security;

create policy facility_bookings_staff
  on public.facility_bookings
  for all
  to authenticated
  using (
    exists (
      select 1 from public.org_memberships m
      where m.organization_id = facility_bookings.organization_id
        and m.user_id = (select auth.uid())
        and m.staff_role is not null
    )
  )
  with check (
    exists (
      select 1 from public.org_memberships m
      where m.organization_id = facility_bookings.organization_id
        and m.user_id = (select auth.uid())
        and m.staff_role is not null
    )
  );

alter table public.children enable row level security;

create policy children_parent_rw
  on public.children
  for all
  to authenticated
  using (
    guardian_user_id = (select auth.uid())
    and exists (
      select 1 from public.org_memberships m
      where m.organization_id = children.organization_id
        and m.user_id = (select auth.uid())
        and m.is_parent = true
    )
  )
  with check (
    guardian_user_id = (select auth.uid())
    and exists (
      select 1 from public.org_memberships m
      where m.organization_id = children.organization_id
        and m.user_id = (select auth.uid())
        and m.is_parent = true
    )
  );

create policy children_staff_read
  on public.children
  for select
  to authenticated
  using (
    exists (
      select 1 from public.org_memberships m
      where m.organization_id = children.organization_id
        and m.user_id = (select auth.uid())
        and m.staff_role is not null
    )
  );

alter table public.enrollments enable row level security;

create policy enrollments_guardian_rw
  on public.enrollments
  for all
  to authenticated
  using (
    exists (
      select 1 from public.children c
      where c.id = enrollments.child_id
        and c.guardian_user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.children c
      where c.id = enrollments.child_id
        and c.guardian_user_id = (select auth.uid())
    )
  );

create policy enrollments_staff
  on public.enrollments
  for all
  to authenticated
  using (
    exists (
      select 1 from public.org_memberships m
      where m.organization_id = enrollments.organization_id
        and m.user_id = (select auth.uid())
        and m.staff_role is not null
    )
  )
  with check (
    exists (
      select 1 from public.org_memberships m
      where m.organization_id = enrollments.organization_id
        and m.user_id = (select auth.uid())
        and m.staff_role is not null
    )
  );

alter table public.waitlist_entries enable row level security;

create policy waitlist_guardian_rw
  on public.waitlist_entries
  for all
  to authenticated
  using (
    exists (
      select 1 from public.children c
      where c.id = waitlist_entries.child_id
        and c.guardian_user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.children c
      where c.id = waitlist_entries.child_id
        and c.guardian_user_id = (select auth.uid())
    )
  );

create policy waitlist_staff
  on public.waitlist_entries
  for all
  to authenticated
  using (
    exists (
      select 1 from public.org_memberships m
      where m.organization_id = waitlist_entries.organization_id
        and m.user_id = (select auth.uid())
        and m.staff_role is not null
    )
  )
  with check (
    exists (
      select 1 from public.org_memberships m
      where m.organization_id = waitlist_entries.organization_id
        and m.user_id = (select auth.uid())
        and m.staff_role is not null
    )
  );

alter table public.audit_logs enable row level security;

create policy audit_logs_staff_read
  on public.audit_logs
  for select
  to authenticated
  using (
    exists (
      select 1 from public.org_memberships m
      where m.organization_id = audit_logs.organization_id
        and m.user_id = (select auth.uid())
        and m.staff_role is not null
    )
  );

create policy audit_logs_staff_insert
  on public.audit_logs
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.org_memberships m
      where m.organization_id = audit_logs.organization_id
        and m.user_id = (select auth.uid())
        and m.staff_role is not null
    )
  );
