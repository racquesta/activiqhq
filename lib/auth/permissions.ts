import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { OrgContext } from "@/lib/auth/org-context";
import { OrgContextError } from "@/lib/auth/org-context-error";

export type RoleTemplateCapabilities = {
  can_manage_activities: boolean;
  can_manage_enrollments: boolean;
  can_manage_staff: boolean;
};

/**
 * Staff-only routes (settings, invites, role templates). Matches current RLS: owner or admin.
 */
export function assertOwnerOrAdmin(ctx: OrgContext): void {
  if (ctx.role !== "owner" && ctx.role !== "admin") {
    throw new OrgContextError(
      "forbidden_tenant_access",
      403,
      "Only organization owners and admins can access this area.",
    );
  }
}

/**
 * Load capability toggles for the signed-in staff member (admin / instructor / coach).
 * Owners are fully privileged and do not use role_templates rows.
 */
export async function loadStaffRoleTemplateCaps(
  supabase: SupabaseClient,
  organizationId: string,
  ctx: OrgContext,
): Promise<RoleTemplateCapabilities | null> {
  if (ctx.role === "owner") {
    return {
      can_manage_activities: true,
      can_manage_enrollments: true,
      can_manage_staff: true,
    };
  }
  if (!["admin", "instructor", "coach"].includes(ctx.role)) {
    return null;
  }

  const { data, error } = await supabase
    .from("role_templates")
    .select(
      "can_manage_activities, can_manage_enrollments, can_manage_staff",
    )
    .eq("organization_id", organizationId)
    .eq("role", ctx.role)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    can_manage_activities: data.can_manage_activities,
    can_manage_enrollments: data.can_manage_enrollments,
    can_manage_staff: data.can_manage_staff,
  };
}

