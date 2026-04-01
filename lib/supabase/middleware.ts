import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Supabase session refresh for Next.js Middleware.
 *
 * What is middleware?
 * - A single file at the project root, `middleware.ts`, runs *before* most requests. It can
 *   read the request, rewrite URLs, set headers, and attach cookies to the response.
 *
 * Why we need this for Supabase:
 * - Auth sessions are backed by tokens stored in cookies. Those tokens expire and need
 *   refreshing. If we only read cookies on the server without ever refreshing, users get
 *   logged out unexpectedly. Calling `getUser()` here triggers a refresh when needed and
 *   writes updated cookies onto the response.
 *
 * How to wire it up:
 * - In root `middleware.ts`, import `updateSession` and return its result (often after
 *   matching which paths should run auth refresh — e.g. everything except static assets).
 *
 * Example (root middleware.ts):
 *   import { type NextRequest } from "next/server";
 *   import { updateSession } from "@/lib/supabase/middleware";
 *
 *   export async function middleware(request: NextRequest) {
 *     return await updateSession(request);
 *   }
 *
 *   export const config = { matcher: [...] }; // optional: limit which routes run middleware
 */
export async function updateSession(request: NextRequest) {
  // Same public vars as the browser client — safe to expose; they only allow anon-key access.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Without config, we cannot build a Supabase client. Pass the request through unchanged.
  if (!url || !anonKey) {
    return NextResponse.next({ request });
  }

  // We may need to attach Set-Cookie headers to the *outgoing* response. That object starts
  // as a normal "continue" response and gets replaced inside setAll() when cookies update.
  // `{ request }` tells Next to forward the incoming request (important for internal headers).
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      // Supabase reads existing session cookies from the incoming request.
      getAll() {
        return request.cookies.getAll();
      },
      // When tokens refresh, Supabase needs to write new cookies. Middleware runs at the edge:
      // we must copy updated cookies onto `supabaseResponse` so the browser receives them.
      setAll(cookiesToSet) {
        // Sync cookie jar on the request object (pattern from @supabase/ssr + Next middleware).
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        // Re-create the response so later `cookies.set` calls apply to a fresh response.
        supabaseResponse = NextResponse.next({ request });
        // `options` carries path, max-age, httpOnly, etc. — required for secure session cookies.
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Validates the session and refreshes it if expired. Side effect: may call setAll() above.
  // You do not have to use the return value here; the refresh is what matters for middleware.
  await supabase.auth.getUser();

  return supabaseResponse;
}
