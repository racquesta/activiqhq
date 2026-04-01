import { notImplementedResponse } from "@/app/api/_not-implemented";

/**
 * Org-wide enrollment limits (max concurrent activities per child).
 */
export async function GET() {
  return notImplementedResponse("GET /api/o/[orgSlug]/enrollment-policy");
}

export async function PATCH() {
  return notImplementedResponse("PATCH /api/o/[orgSlug]/enrollment-policy");
}
