import { notImplementedResponse } from "@/app/api/_not-implemented";

/**
 * Staff role template listing (capabilities per role).
 */
export async function GET() {
  return notImplementedResponse("GET /api/o/[orgSlug]/role-templates");
}
