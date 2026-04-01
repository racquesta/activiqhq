-- Split guardians out of organization_memberships.
-- Keep organization_memberships for staff roles only.

-- 1) Backfill guardian memberships from any existing guardian role rows.
insert into public.guardian_memberships (organization_id, user_id)
select m.organization_id, m.user_id
from public.organization_memberships m
where m.role = 'guardian'
on conflict (organization_id, user_id) do nothing;

-- 2) Remove guardian rows from organization_memberships.
delete from public.organization_memberships
where role = 'guardian';

-- 3) Enforce staff-only role values at the table boundary.
alter table public.organization_memberships
  drop constraint if exists organization_memberships_staff_role_only;

alter table public.organization_memberships
  add constraint organization_memberships_staff_role_only
  check (role in ('owner', 'admin', 'instructor', 'coach'));
