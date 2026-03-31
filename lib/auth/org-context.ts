import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ERROR_CODES } from "@/lib/validations/actions";

export type OrgMembershipRow = {
  id: string;
  organization_id: string;
  user_id: string;
  staff_role: string | null;
  staff_label: string | null;
  is_parent: boolean;
  permissions: unknown;
  permissions_version: number;
  updated_at: string;
  created_at: string;
};

export async function getOrganizationBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<{ organization: { id: string; slug: string; name: string } | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("organizations")
    .select("id, slug, name")
    .eq("slug", slug)
    .maybeSingle();

  return {
    organization: data,
    error: error ? new Error(error.message) : null,
  };
}

export async function requireOrgMembership(
  slug: string,
  userId: string
): Promise<
  | { ok: true; organizationId: string; membership: OrgMembershipRow }
  | { ok: false; code: string }
> {
  const supabase = await createClient();
  const { organization, error: orgErr } = await getOrganizationBySlug(supabase, slug);
  if (orgErr || !organization) {
    return { ok: false, code: ERROR_CODES.ORG_NOT_FOUND };
  }

  const { data: membership, error: memErr } = await supabase
    .from("org_memberships")
    .select(
      "id, organization_id, user_id, staff_role, staff_label, is_parent, permissions, permissions_version, updated_at, created_at"
    )
    .eq("organization_id", organization.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (memErr || !membership) {
    return { ok: false, code: ERROR_CODES.FORBIDDEN };
  }

  return {
    ok: true,
    organizationId: organization.id,
    membership: membership as OrgMembershipRow,
  };
}

export function isStaffMembership(m: OrgMembershipRow): boolean {
  return m.staff_role != null;
}

export function isParentMembership(m: OrgMembershipRow): boolean {
  return m.is_parent === true;
}
