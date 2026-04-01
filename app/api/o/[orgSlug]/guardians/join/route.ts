import { notImplementedResponse } from "@/app/api/_not-implemented";

/**
 * Link current guardian user to organization membership.
 */
export async function POST() {
  return notImplementedResponse("POST /api/o/[orgSlug]/guardians/join");
}
