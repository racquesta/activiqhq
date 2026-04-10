-- Bootstrap organizations: first owner membership, default role templates, enrollment policy.
-- RLS otherwise blocks the creator from inserting the initial membership.

create or replace function public.bootstrap_new_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.organization_memberships (organization_id, user_id, role, status)
  values (new.id, new.created_by_user_id, 'owner', 'active');

  insert into public.role_templates (organization_id, role, can_manage_activities, can_manage_enrollments, can_manage_staff, updated_by_user_id)
  values
    (new.id, 'admin', false, false, false, new.created_by_user_id),
    (new.id, 'instructor', false, false, false, new.created_by_user_id),
    (new.id, 'coach', false, false, false, new.created_by_user_id);

  insert into public.enrollment_policies (organization_id, max_concurrent_activities_per_child, updated_by_user_id)
  values (new.id, 1, new.created_by_user_id);

  return new;
end;
$$;

drop trigger if exists organizations_bootstrap_after_insert on public.organizations;
create trigger organizations_bootstrap_after_insert
after insert on public.organizations
for each row execute function public.bootstrap_new_organization();

create index if not exists invites_token_hash_pending_idx
  on public.invites (token_hash)
  where status = 'pending';

-- Accept a staff invite using a raw token (hashed with SHA-256 hex, same as app/api invite create).
create or replace function public.accept_organization_invite(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_hash text;
  r public.invites%rowtype;
  v_email text;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'unauthorized');
  end if;

  if p_token is null or length(trim(p_token)) < 10 then
    return jsonb_build_object('ok', false, 'error', 'invalid_token');
  end if;

  v_hash := encode(digest(convert_to(p_token, 'UTF8'), 'sha256'), 'hex');

  select * into r from public.invites
  where token_hash = v_hash
    and status = 'pending'
    and expires_at > timezone('utc'::text, now());

  if not found then
    return jsonb_build_object('ok', false, 'error', 'invalid_or_expired');
  end if;

  select email into v_email from auth.users where id = v_uid;
  if v_email is null or lower(v_email) <> lower(r.email) then
    return jsonb_build_object('ok', false, 'error', 'email_mismatch');
  end if;

  if exists (
    select 1 from public.organization_memberships m
    where m.organization_id = r.organization_id
      and m.user_id = v_uid
      and m.status = 'active'
  ) then
    return jsonb_build_object('ok', false, 'error', 'already_member');
  end if;

  insert into public.organization_memberships (organization_id, user_id, role, status)
  values (
    r.organization_id,
    v_uid,
    r.role::text::public.membership_role,
    'active'
  );

  update public.invites
  set status = 'accepted'
  where id = r.id;

  return jsonb_build_object('ok', true, 'organization_id', r.organization_id);
end;
$$;

grant execute on function public.accept_organization_invite(text) to authenticated;
