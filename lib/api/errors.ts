import { NextResponse } from "next/server";
import type { ZodError } from "zod";

import { OrgContextError } from "@/lib/auth/org-context-error";
import { UnauthorizedError } from "@/lib/auth/require-user";

export type ApiErrorCode =
  | "403_forbidden_tenant_access"
  | "404_organization_not_found"
  | "409_slug_conflict"
  | "409_duplicate_child_confirmation_required"
  | "409_enrollment_limit_reached"
  | "422_validation_error";

export type ApiErrorBody = {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
};

export function apiErrorResponse(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: unknown,
): NextResponse<ApiErrorBody> {
  const body: ApiErrorBody = { code, message };
  if (details !== undefined) {
    body.details = details;
  }
  return NextResponse.json(body, { status });
}

export function forbiddenTenantAccess(
  message = "You do not have access to this organization.",
) {
  return apiErrorResponse(403, "403_forbidden_tenant_access", message);
}

export function organizationNotFound(
  message = "No organization exists for this slug.",
) {
  return apiErrorResponse(404, "404_organization_not_found", message);
}

export function slugConflict(
  message = "This organization URL is already taken.",
) {
  return apiErrorResponse(409, "409_slug_conflict", message);
}

export function duplicateChildConfirmationRequired(
  message = "A child with similar details may already exist; confirm to proceed.",
) {
  return apiErrorResponse(
    409,
    "409_duplicate_child_confirmation_required",
    message,
  );
}

export function enrollmentLimitReached(
  message = "This child is already enrolled in the maximum number of activities allowed by the organization.",
) {
  return apiErrorResponse(409, "409_enrollment_limit_reached", message);
}

export function validationError(
  message = "Request validation failed.",
  details?: unknown,
) {
  return apiErrorResponse(422, "422_validation_error", message, details);
}

export function validationErrorFromZod(error: ZodError) {
  return validationError("Request validation failed.", {
    issues: error.issues,
  });
}

export function unauthorizedJson(message = "Authentication required.") {
  return NextResponse.json(
    { code: "401_unauthorized", message },
    { status: 401 },
  );
}

function isPostgrestLikeError(
  error: unknown,
): error is { message: string; code?: string; details?: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  );
}

/** Map thrown auth/org errors to JSON responses; never throws (avoids HTML 500 + broken fetch JSON). */
export function jsonFromCaughtRouteError(error: unknown): NextResponse {
  if (error instanceof UnauthorizedError) {
    return unauthorizedJson(error.message);
  }
  if (error instanceof OrgContextError) {
    if (error.code === "organization_not_found") {
      return organizationNotFound(error.message);
    }
    if (error.code === "forbidden_tenant_access") {
      return forbiddenTenantAccess(error.message);
    }
    if (error.code === "missing_org_slug") {
      return validationError(error.message);
    }
    return NextResponse.json(
      { message: error.message },
      { status: error.status },
    );
  }
  if (isPostgrestLikeError(error)) {
    return NextResponse.json(
      {
        code: "500_database_error",
        message: error.message,
        details: error.details ?? error.code,
      },
      { status: 500 },
    );
  }
  console.error("Unhandled route error:", error);
  return NextResponse.json(
    {
      code: "500_internal_error",
      message: "Unexpected server error.",
    },
    { status: 500 },
  );
}
