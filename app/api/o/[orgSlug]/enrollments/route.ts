import {
  enrollmentLimitReached,
  forbiddenTenantAccess,
  jsonFromCaughtRouteError,
  validationError,
  validationErrorFromZod,
} from "@/lib/api/errors";
import { loadOrgContextWithClient } from "@/lib/auth/org-context";
import { assertChildBelowEnrollmentLimit } from "@/lib/org/enrollment-policy";
import { enrollmentCreateSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ orgSlug: string }> };

/**
 * Create enrollment; enforces per-child org policy and published activity rules.
 */
export async function POST(request: Request, context: Ctx) {
  try {
    const { orgSlug } = await context.params;
    const orgCtx = await loadOrgContextWithClient({ orgSlug });

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return validationError("Request body must be valid JSON.");
    }

    const parsed = enrollmentCreateSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorFromZod(parsed.error);
    }

    const { activityId, childId } = parsed.data;
    const { supabase, organizationId, isStaff, userId } = orgCtx;

    const { data: child, error: childError } = await supabase
      .from("child_profiles")
      .select("id, guardian_user_id")
      .eq("id", childId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (childError) {
      throw childError;
    }
    if (!child) {
      return validationError("Child not found in this organization.");
    }
    if (!isStaff && child.guardian_user_id !== userId) {
      return forbiddenTenantAccess(
        "You can only enroll your own children in activities.",
      );
    }

    const { data: activity, error: activityError } = await supabase
      .from("activities")
      .select("id, is_published, organization_id")
      .eq("id", activityId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (activityError) {
      throw activityError;
    }
    if (!activity) {
      return validationError("Activity not found in this organization.");
    }
    if (!activity.is_published) {
      return validationError("This activity is not open for enrollment.");
    }

    const { data: existing } = await supabase
      .from("enrollments")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("activity_id", activityId)
      .eq("child_id", childId)
      .eq("status", "active")
      .maybeSingle();

    if (existing) {
      return validationError("This child is already enrolled in this activity.");
    }

    const limitCheck = await assertChildBelowEnrollmentLimit(
      supabase,
      organizationId,
      childId,
    );
    if (!limitCheck.ok) {
      return enrollmentLimitReached();
    }

    const { data: enrollment, error: insertError } = await supabase
      .from("enrollments")
      .insert({
        organization_id: organizationId,
        activity_id: activityId,
        child_id: childId,
        status: "active",
      })
      .select("id, activity_id, child_id, status, created_at")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return validationError(
          "This child is already enrolled in this activity.",
        );
      }
      throw insertError;
    }

    return Response.json(
      {
        enrollment: {
          id: enrollment.id,
          activityId: enrollment.activity_id,
          childId: enrollment.child_id,
          status: enrollment.status,
          createdAt: enrollment.created_at,
        },
      },
      { status: 201 },
    );
  } catch (e) {
    return jsonFromCaughtRouteError(e);
  }
}
