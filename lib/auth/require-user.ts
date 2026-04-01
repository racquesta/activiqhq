/**
 * Server-only helpers that require a logged-in Supabase user.
 *
 * Use in Server Components, Server Actions, and Route Handlers when the page or mutation
 * must not run for anonymous visitors. This file must not be imported from Client Components.
 *
 * Flow:
 * 1. Build a server Supabase client (reads session from cookies).
 * 2. Call `getUser()` — validates the JWT with Supabase; prefer this over `getSession()` on the server.
 * 3. If there is no user, redirect to login (or throw for APIs — see `requireUserOrThrow`).
 */
import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

const DEFAULT_LOGIN_PATH = "/login";

export type AuthenticatedContext = {
  user: User;
  supabase: Awaited<ReturnType<typeof createClient>>;
};

/**
 * Returns the current user and Supabase client, or redirects to the login page.
 *
 * @param redirectTo - Where to send unauthenticated users (defaults to `/login` or `NEXT_PUBLIC_LOGIN_PATH`).
 */
export async function requireUser(options?: {
  redirectTo?: string;
}): Promise<AuthenticatedContext> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    const path =
      options?.redirectTo ??
      process.env.NEXT_PUBLIC_LOGIN_PATH ??
      DEFAULT_LOGIN_PATH;
    redirect(path);
  }

  return { user, supabase };
}

/** Thrown by `requireUserOrThrow` so Route Handlers can map to HTTP 401. */
export class UnauthorizedError extends Error {
  readonly status = 401;

  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Same as `requireUser`, but throws `UnauthorizedError` instead of redirecting. Use in Route
 * Handlers when you want to return JSON 401 instead of an HTML redirect.
 */
export async function requireUserOrThrow(): Promise<AuthenticatedContext> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new UnauthorizedError();
  }

  return { user, supabase };
}
