/**
 * Browser-side Supabase client (runs in the user's browser).
 *
 * When to use:
 * - In Client Components: files that start with `"use client"` at the top, or hooks like
 *   useEffect/useState that need to talk to Supabase (auth, realtime, etc.).
 *
 * When NOT to use:
 * - In Server Components, API routes, or server actions — use `@/lib/supabase/server` instead.
 *
 * How it works (short version):
 * - Next.js splits your app into server code (runs on the server) and client code (runs in
 *   the browser). This client reads the same public env vars and stores auth in cookies
 *   that `@supabase/ssr` manages together with the server + middleware helpers.
 *
 * Example:
 *   "use client";
 *   import { createClient } from "@/lib/supabase/client";
 *   const supabase = createClient();
 *   await supabase.auth.signInWithPassword({ email, password });
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return createBrowserClient(url, anonKey);
}
