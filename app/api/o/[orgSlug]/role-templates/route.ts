import { loadOrgContextWithClient } from "@/lib/auth/org-context";
import { jsonFromCaughtRouteError } from "@/lib/api/errors";

type Ctx = { params: Promise<{ orgSlug: string }> };

export async function GET(_request: Request, context: Ctx) {
  try {
    const { orgSlug } = await context.params;
    const orgCtx = await loadOrgContextWithClient({ orgSlug });

    const { supabase } = orgCtx;
    const { data, error } = await supabase
      .from("role_templates")
      .select(
        "id, role, can_manage_activities, can_manage_enrollments, can_manage_staff, updated_at",
      )
      .eq("organization_id", orgCtx.organizationId)
      .order("role");

    if (error) {
      throw error;
    }

    return Response.json({ templates: data ?? [] });
  } catch (e) {
    return jsonFromCaughtRouteError(e);
  }
}
