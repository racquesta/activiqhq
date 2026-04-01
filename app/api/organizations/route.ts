import { notImplementedResponse } from "@/app/api/_not-implemented";

/**
 * Organization APIs (create org, etc.).
 * `POST` — see specs contract: create organization with globally unique slug.
 */
export async function POST() {
  return notImplementedResponse("POST /api/organizations");
}
