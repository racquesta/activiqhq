import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

function resolveOrgSlug(pathname: string) {
  // Expected org routes look like /o/{orgSlug}/...
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] !== "o") {
    return "";
  }

  return segments[1] ?? "";
}

// Next.js runs this automatically for every request that matches `config.matcher`.
// You do not call this function directly from app code.
export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  requestHeaders.set("x-org-slug", resolveOrgSlug(request.nextUrl.pathname));

  return updateSession(request, requestHeaders);
}

// This `config` export is read by Next.js itself (you never import it manually).
// `matcher` tells Next which request paths should execute `middleware()` and which should skip it.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
