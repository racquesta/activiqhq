import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { SupabaseClient } from "@supabase/supabase-js";

import { OrgContextError } from "@/lib/auth/org-context-error";
import { requireUserOrThrow } from "@/lib/auth/require-user";

export { OrgContextError } from "@/lib/auth/org-context-error";

type StaffRole = "owner" | "admin" | "instructor" | "coach";
type EffectiveOrgRole = StaffRole | "guardian_member";

/** Resolved tenant + membership facts only (no DB client). Use for permission checks and pure logic. */
export type OrgContext = {
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  userId: string;
  role: EffectiveOrgRole;
  isStaff: boolean;
  isGuardian: boolean;
};

/** Same as `OrgContext` plus the user-scoped Supabase client used to resolve it. For Server Components / routes that run queries. */
export type OrgContextWithClient = OrgContext & {
  supabase: SupabaseClient;
};

type LoadOrgContextOptions = {
  orgSlug?: string;
};

function parseOrgSlugFromPathname(pathname: string | null): string {
  if (!pathname) {
    return "";
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== "o") {
    return "";
  }

  return segments[1] ?? "";
}

async function resolveOrgSlug(explicitSlug?: string): Promise<string> {
  if (explicitSlug) {
    return explicitSlug.trim();
  }

  const requestHeaders = await headers();
  const fromHeader = requestHeaders.get("x-org-slug")?.trim();
  if (fromHeader) {
    return fromHeader;
  }

  return parseOrgSlugFromPathname(requestHeaders.get("x-pathname"));
}

async function loadOrgContextCore(
  options?: LoadOrgContextOptions,
): Promise<{ org: OrgContext; supabase: SupabaseClient }> {
  const orgSlug = await resolveOrgSlug(options?.orgSlug);

  if (!orgSlug) {
    throw new OrgContextError(
      "missing_org_slug",
      400,
      "Missing organization slug in route context",
    );
  }

  const { user, supabase } = await requireUserOrThrow();

  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("id, slug, name")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (orgError || !organization) {
    throw new OrgContextError(
      "organization_not_found",
      404,
      "Organization not found",
    );
  }

  const [{ data: staffMembership }, { data: guardianMembership }] =
    await Promise.all([
      supabase
        .from("organization_memberships")
        .select("role")
        .eq("organization_id", organization.id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle(),
      supabase
        .from("guardian_memberships")
        .select("id")
        .eq("organization_id", organization.id)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  const isStaff = Boolean(
    staffMembership &&
      ["owner", "admin", "instructor", "coach"].includes(staffMembership.role),
  );
  const isGuardian = Boolean(guardianMembership);

  if (!isStaff && !isGuardian) {
    throw new OrgContextError(
      "forbidden_tenant_access",
      403,
      "You do not belong to this organization",
    );
  }

  const org: OrgContext = {
    organizationId: organization.id,
    organizationSlug: organization.slug,
    organizationName: organization.name,
    userId: user.id,
    role: staffMembership?.role ?? "guardian_member",
    isStaff,
    isGuardian,
  };

  return { org, supabase };
}

/**
 * Loads and validates tenant context for the current authenticated user (data only).
 *
 * Use for permission checks (`assertOwnerOrAdmin`, etc.) and logic that does not
 * need to issue further queries. For DB access, use `loadOrgContextWithClient`.
 */
export async function loadOrgContext(
  options?: LoadOrgContextOptions,
): Promise<OrgContext> {
  const { org } = await loadOrgContextCore(options);
  return org;
}

/**
 * Same resolution as `loadOrgContext`, plus the user-scoped Supabase client.
 * Prefer this in Route Handlers and Server Components that query Supabase after auth.
 */
export async function loadOrgContextWithClient(
  options?: LoadOrgContextOptions,
): Promise<OrgContextWithClient> {
  const { org, supabase } = await loadOrgContextCore(options);
  return { ...org, supabase };
}

/**
 * Same as `loadOrgContext`, but redirects instead of throwing.
 * Useful for page-level guards where redirect UX is preferred.
 */
export async function requireOrgContext(
  options?: LoadOrgContextOptions & { redirectTo?: string },
): Promise<OrgContext> {
  try {
    return await loadOrgContext(options);
  } catch {
    redirect(options?.redirectTo ?? "/");
  }
}
