import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server Supabase client for Server Components, Server Actions, and Route Handlers.
 * Cookie writes may throw in Server Components; session refresh belongs in middleware
 * (`lib/supabase/middleware.ts`).
 *
 * MVP: single Supabase project (US). Post-MVP dual-region routing: see spec FR-018
 * and tasks Phase 8 (`lib/supabase/server-for-org.ts` or equivalent).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component without mutable response cookies — middleware must refresh.
          }
        },
      },
    }
  );
}
