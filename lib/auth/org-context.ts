import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireUserOrThrow } from "@/lib/auth/require-user";

type StaffRole = "owner" | "admin" | "instructor" | "coach";
type EffectiveOrgRole = StaffRole | "guardian_member";

export type OrgContext = {
  organizationId: string;
  organizationSlug: string;
  organizationName: string;
  userId: string;
  role: EffectiveOrgRole;
  isStaff: boolean;
  isGuardian: boolean;
};

type LoadOrgContextOptions = {
  orgSlug?: string;
};

export class OrgContextError extends Error {
  readonly status: number;
  readonly code:
    | "missing_org_slug"
    | "organization_not_found"
    | "forbidden_tenant_access";

  constructor(
    code: OrgContextError["code"],
    status: number,
    message = "Organization context error",
  ) {
    super(message);
    this.name = "OrgContextError";
    this.status = status;
    this.code = code;
  }
}

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

/**
 * Loads and validates tenant context for the current authenticated user.
 *
 * Use this in Server Components, Server Actions, and Route Handlers to ensure
 * the URL's `/o/{orgSlug}` context is real and belongs to the current user.
 */
export async function loadOrgContext(
  options?: LoadOrgContextOptions,
): Promise<OrgContext> {
  // resolves from request headers or pathname
  const orgSlug = await resolveOrgSlug(options?.orgSlug);

  if (!orgSlug) {
    throw new OrgContextError(
      "missing_org_slug",
      400,
      "Missing organization slug in route context",
    );
  }

  // throws UnauthorizedError if user is not authenticated
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

  return {
    organizationId: organization.id,
    organizationSlug: organization.slug,
    organizationName: organization.name,
    userId: user.id,
    role: staffMembership?.role ?? "guardian_member",
    isStaff,
    isGuardian,
  };
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
