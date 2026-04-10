import { loadOrgContextWithClient } from "@/lib/auth/org-context";
import { assertOwnerOrAdmin } from "@/lib/auth/permissions";
import {
  jsonFromCaughtRouteError,
  validationError,
  validationErrorFromZod,
} from "@/lib/api/errors";
import { roleTemplatePatchSchema } from "@/lib/validations";

const allowedRoles = new Set(["admin", "instructor", "coach"]);

type Ctx = { params: Promise<{ orgSlug: string; role: string }> };

export async function PATCH(request: Request, context: Ctx) {
  try {
    const { orgSlug, role } = await context.params;
    if (!allowedRoles.has(role)) {
      return validationError("role must be admin, instructor, or coach.");
    }

    const orgCtx = await loadOrgContextWithClient({ orgSlug });
    assertOwnerOrAdmin(orgCtx);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return validationError("Request body must be valid JSON.");
    }

    const parsed = roleTemplatePatchSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorFromZod(parsed.error);
    }

    const patch: Record<string, boolean | string> = {};
    const d = parsed.data;
    if (d.canManageActivities !== undefined) {
      patch.can_manage_activities = d.canManageActivities;
    }
    if (d.canManageEnrollments !== undefined) {
      patch.can_manage_enrollments = d.canManageEnrollments;
    }
    if (d.canManageStaff !== undefined) {
      patch.can_manage_staff = d.canManageStaff;
    }

    patch.updated_by_user_id = orgCtx.userId;

    const { data, error } = await orgCtx.supabase
      .from("role_templates")
      .update(patch)
      .eq("organization_id", orgCtx.organizationId)
      .eq("role", role)
      .select(
        "id, role, can_manage_activities, can_manage_enrollments, can_manage_staff, updated_at",
      )
      .single();

    if (error) {
      throw error;
    }

    return Response.json({ template: data });
  } catch (e) {
    return jsonFromCaughtRouteError(e);
  }
}
