/**
 * Server-side Supabase client (runs only on the Next.js server).
 *
 * The line below prevents this file from being imported by Client Components by accident.
 * If you import it in a `"use client"` file, the build will error — that is intentional.
 */
import "server-only";

/**
 * When to use:
 * - Server Components (default in the `app/` directory — no `"use client"`).
 * - Route Handlers: `app/api/.../route.ts`
 * - Server Actions: functions marked with `"use server"`
 *
 * Why it's different from `client.ts`:
 * - On the server, there is no `window`. Auth is stored in HTTP cookies. This client uses
 *   Next.js `cookies()` so Supabase can read/write the session cookies for the current request.
 *
 * Note: `createClient()` is async because in this Next.js version `cookies()` is async.
 *
 * Example (Server Component):
 *   import { createClient } from "@/lib/supabase/server";
 *   export default async function Page() {
 *     const supabase = await createClient();
 *     const { data: { user } } = await supabase.auth.getUser();
 *     ...
 *   }
 */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Some server contexts cannot mutate cookies (e.g. static render). Session refresh
          // in middleware still keeps users logged in for normal browsing.
        }
      },
    },
  });
}
