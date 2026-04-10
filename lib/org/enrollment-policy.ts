import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type EnrollmentPolicyRow = {
  max_concurrent_activities_per_child: number;
  updated_at: string;
  updated_by_user_id: string | null;
};

export async function fetchEnrollmentPolicy(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<EnrollmentPolicyRow | null> {
  const { data, error } = await supabase
    .from("enrollment_policies")
    .select(
      "max_concurrent_activities_per_child, updated_at, updated_by_user_id",
    )
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data;
}

export async function countActiveEnrollmentsForChild(
  supabase: SupabaseClient,
  organizationId: string,
  childId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("child_id", childId)
    .eq("status", "active");

  if (error) {
    throw error;
  }
  return count ?? 0;
}

/** Active enrollment activity ids for a child (any status active rows). */
export async function activeEnrollmentActivityIdsForChild(
  supabase: SupabaseClient,
  organizationId: string,
  childId: string,
): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("enrollments")
    .select("activity_id")
    .eq("organization_id", organizationId)
    .eq("child_id", childId)
    .eq("status", "active");

  if (error) {
    throw error;
  }
  return new Set((data ?? []).map((r) => r.activity_id as string));
}

export async function assertChildBelowEnrollmentLimit(
  supabase: SupabaseClient,
  organizationId: string,
  childId: string,
): Promise<
  | { ok: true; maxConcurrent: number; activeCount: number }
  | { ok: false; reason: "at_limit"; maxConcurrent: number; activeCount: number }
> {
  const policy = await fetchEnrollmentPolicy(supabase, organizationId);
  const maxConcurrent = policy?.max_concurrent_activities_per_child ?? 1;
  const activeCount = await countActiveEnrollmentsForChild(
    supabase,
    organizationId,
    childId,
  );

  if (activeCount >= maxConcurrent) {
    return { ok: false, reason: "at_limit", maxConcurrent, activeCount };
  }
  return { ok: true, maxConcurrent, activeCount };
}
