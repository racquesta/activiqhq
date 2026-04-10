-- Org creation hit a chicken-and-egg with RLS:
-- 1) SELECT on organizations required is_org_member, but the creator is not a member until the bootstrap trigger runs.
-- 2) INSERT into organization_memberships / role_templates / enrollment_policies in the trigger required
--    has_org_role(owner|admin), which is false before the first membership row exists.
-- This migration adds parallel "creator bootstrap" paths that only apply when auth.uid() is the org's created_by_user_id.

drop policy if exists organizations_select_member on public.organizations;
create policy organizations_select_member
on public.organizations
for select
using (
  public.is_org_member(id)
  or created_by_user_id = auth.uid()
);

drop policy if exists memberships_insert_creator_bootstrap on public.organization_memberships;
create policy memberships_insert_creator_bootstrap
on public.organization_memberships
for insert
with check (
  user_id = auth.uid()
  and role = 'owner'::public.membership_role
  and status = 'active'::public.membership_status
  and exists (
    select 1
    from public.organizations o
    where o.id = organization_id
      and o.created_by_user_id = auth.uid()
  )
);

drop policy if exists role_templates_insert_org_creator on public.role_templates;
create policy role_templates_insert_org_creator
on public.role_templates
for insert
with check (
  exists (
    select 1
    from public.organizations o
    where o.id = organization_id
      and o.created_by_user_id = auth.uid()
  )
  and updated_by_user_id = auth.uid()
);

drop policy if exists enrollment_policies_insert_org_creator on public.enrollment_policies;
create policy enrollment_policies_insert_org_creator
on public.enrollment_policies
for insert
with check (
  exists (
    select 1
    from public.organizations o
    where o.id = organization_id
      and o.created_by_user_id = auth.uid()
  )
  and updated_by_user_id = auth.uid()
);
