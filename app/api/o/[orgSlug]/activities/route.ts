import {
  forbiddenTenantAccess,
  jsonFromCaughtRouteError,
  validationError,
} from "@/lib/api/errors";
import type { SupabaseClient } from "@supabase/supabase-js";

import { loadOrgContextWithClient } from "@/lib/auth/org-context";
import {
  activeEnrollmentActivityIdsForChild,
  countActiveEnrollmentsForChild,
  fetchEnrollmentPolicy,
} from "@/lib/org/enrollment-policy";
import { z } from "zod";

type Ctx = { params: Promise<{ orgSlug: string }> };

type ActivityRow = {
  id: string;
  title: string;
  activity_type: string;
  starts_at: string;
  ends_at: string;
  capacity: number | null;
  is_published: boolean;
};

function toActivityJson(row: ActivityRow) {
  return {
    id: row.id,
    title: row.title,
    activityType: row.activity_type,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    capacity: row.capacity,
    isPublished: row.is_published,
  };
}

async function loadChildForEligibility(
  supabase: SupabaseClient,
  organizationId: string,
  childId: string,
) {
  const { data, error } = await supabase
    .from("child_profiles")
    .select("id, guardian_user_id")
    .eq("id", childId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data;
}

/**
 * Activity listing with optional eligibility filter (`eligibleForChildId`).
 */
export async function GET(request: Request, context: Ctx) {
  try {
    const { orgSlug } = await context.params;
    const orgCtx = await loadOrgContextWithClient({ orgSlug });
    const { supabase, organizationId, isStaff } = orgCtx;

    const eligibleRaw = new URL(request.url).searchParams.get(
      "eligibleForChildId",
    );
    let eligibleForChildId: string | null = null;
    if (eligibleRaw !== null && eligibleRaw !== "") {
      const idParse = z.uuid().safeParse(eligibleRaw);
      if (!idParse.success) {
        return validationError("eligibleForChildId must be a valid UUID.");
      }
      eligibleForChildId = idParse.data;
    }

    let query = supabase
      .from("activities")
      .select(
        "id, title, activity_type, starts_at, ends_at, capacity, is_published",
      )
      .eq("organization_id", organizationId)
      .order("starts_at", { ascending: true });

    if (!isStaff) {
      query = query.eq("is_published", true);
    }

    const { data: rows, error: listError } = await query;
    if (listError) {
      throw listError;
    }

    const activities = (rows ?? []) as ActivityRow[];

    if (!eligibleForChildId) {
      return Response.json({
        activities: activities.map(toActivityJson),
      });
    }

    const child = await loadChildForEligibility(
      supabase,
      organizationId,
      eligibleForChildId,
    );
    if (!child) {
      return validationError("Child not found in this organization.");
    }
    if (!isStaff && child.guardian_user_id !== orgCtx.userId) {
      return forbiddenTenantAccess(
        "You can only request eligibility for your own children.",
      );
    }

    const policy = await fetchEnrollmentPolicy(supabase, organizationId);
    const maxConcurrent = policy?.max_concurrent_activities_per_child ?? 1;
    const activeCount = await countActiveEnrollmentsForChild(
      supabase,
      organizationId,
      eligibleForChildId,
    );
    const enrolledIds = await activeEnrollmentActivityIdsForChild(
      supabase,
      organizationId,
      eligibleForChildId,
    );

    const eligible = activities.filter((a) => {
      if (!a.is_published) {
        return false;
      }
      if (enrolledIds.has(a.id)) {
        return false;
      }
      return activeCount < maxConcurrent;
    });

    return Response.json({
      activities: eligible.map(toActivityJson),
      eligibility: {
        maxConcurrentActivitiesPerChild: maxConcurrent,
        activeEnrollmentCount: activeCount,
      },
    });
  } catch (e) {
    return jsonFromCaughtRouteError(e);
  }
}
