import {
  jsonFromCaughtRouteError,
  validationError,
  validationErrorFromZod,
} from "@/lib/api/errors";
import { loadOrgContextWithClient } from "@/lib/auth/org-context";
import { assertOwnerOrAdmin } from "@/lib/auth/permissions";
import { fetchEnrollmentPolicy } from "@/lib/org/enrollment-policy";
import { enrollmentPolicyPatchSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ orgSlug: string }> };

function policyJson(row: {
  max_concurrent_activities_per_child: number;
  updated_at: string;
  updated_by_user_id: string | null;
}) {
  return {
    maxConcurrentActivitiesPerChild: row.max_concurrent_activities_per_child,
    updatedAt: row.updated_at,
    updatedByUserId: row.updated_by_user_id,
  };
}

/**
 * Org-wide enrollment limits (max concurrent activities per child).
 */
export async function GET(_request: Request, context: Ctx) {
  try {
    const { orgSlug } = await context.params;
    const orgCtx = await loadOrgContextWithClient({ orgSlug });
    const row = await fetchEnrollmentPolicy(
      orgCtx.supabase,
      orgCtx.organizationId,
    );
    if (!row) {
      return validationError(
        "Enrollment policy is not configured for this organization.",
      );
    }
    return Response.json(policyJson(row));
  } catch (e) {
    return jsonFromCaughtRouteError(e);
  }
}

export async function PATCH(request: Request, context: Ctx) {
  try {
    const { orgSlug } = await context.params;
    const orgCtx = await loadOrgContextWithClient({ orgSlug });
    assertOwnerOrAdmin(orgCtx);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return validationError("Request body must be valid JSON.");
    }

    const parsed = enrollmentPolicyPatchSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorFromZod(parsed.error);
    }

    const { data, error } = await orgCtx.supabase
      .from("enrollment_policies")
      .update({
        max_concurrent_activities_per_child:
          parsed.data.maxConcurrentActivitiesPerChild,
        updated_by_user_id: orgCtx.userId,
      })
      .eq("organization_id", orgCtx.organizationId)
      .select(
        "max_concurrent_activities_per_child, updated_at, updated_by_user_id",
      )
      .single();

    if (error) {
      throw error;
    }

    return Response.json(policyJson(data));
  } catch (e) {
    return jsonFromCaughtRouteError(e);
  }
}
