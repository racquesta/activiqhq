import { notImplementedResponse } from "@/app/api/_not-implemented";

/**
 * Activity listing with optional eligibility filter (`eligibleForChildId`).
 */
export async function GET() {
  return notImplementedResponse("GET /api/o/[orgSlug]/activities");
}
