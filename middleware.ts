import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Supabase session refresh + request headers for downstream layouts (tasks T013).
 * Merge Set-Cookie from session refresh into the final response.
 */
export async function middleware(request: NextRequest) {
  const sessionResponse = await updateSession(request);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  const slugMatch = request.nextUrl.pathname.match(/^\/o\/([^/]+)/);
  if (slugMatch?.[1]) {
    requestHeaders.set("x-org-slug", slugMatch[1]);
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Preserve full cookie attributes (path, max-age, …) from Supabase refresh.
  sessionResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      response.headers.append(key, value);
    }
  });

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
