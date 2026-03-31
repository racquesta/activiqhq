-- FR-004: optimistic concurrency on permission edits.
-- FR-003 MVP: invitations cannot target `owner` (sole owner = org creator only).

alter table public.org_memberships
  add column if not exists permissions_version integer not null default 0;

alter table public.org_memberships
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.set_org_memberships_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists org_memberships_set_updated_at on public.org_memberships;
create trigger org_memberships_set_updated_at
  before update on public.org_memberships
  for each row
  execute procedure public.set_org_memberships_updated_at();

-- Replace invitations role check: MVP invite targets admin | instructor | coach only.
alter table public.invitations drop constraint if exists invitations_intended_staff_role_check;
alter table public.invitations
  add constraint invitations_intended_staff_role_check
  check (intended_staff_role in ('admin', 'instructor', 'coach'));
