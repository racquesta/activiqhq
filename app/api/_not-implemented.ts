import { NextResponse } from "next/server";

/**
 * Placeholder response for route handlers that will be implemented in later tasks.
 * Returns HTTP 501 with a stable JSON shape aligned with the API error contract prefix.
 */
export function notImplementedResponse(endpoint: string) {
  return NextResponse.json(
    {
      code: "not_implemented",
      message: `${endpoint} is not implemented yet`,
    },
    { status: 501 },
  );
}
