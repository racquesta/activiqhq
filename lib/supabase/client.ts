import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client (singleton inside @supabase/ssr).
 * Use in Client Components only.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
