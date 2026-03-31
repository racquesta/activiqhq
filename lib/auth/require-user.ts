import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export class NotAuthenticatedError extends Error {
  constructor(message = "Not authenticated") {
    super(message);
    this.name = "NotAuthenticatedError";
  }
}

/** Verified user from Auth server (prefer over getSession for authz). */
export async function requireSession(): Promise<{
  supabase: SupabaseClient;
  user: User;
}> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new NotAuthenticatedError();
  }
  return { supabase, user };
}

/** Session user plus `profiles` row (must exist after auth.users trigger). */
export async function requireProfile(): Promise<{
  supabase: SupabaseClient;
  user: User;
  profile: { id: string; display_name: string | null; created_at: string };
}> {
  const { supabase, user } = await requireSession();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, display_name, created_at")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    throw new NotAuthenticatedError("Profile not found");
  }

  return { supabase, user, profile };
}
