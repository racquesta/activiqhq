"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type AcceptInviteResult =
  | { ok: true }
  | { ok: false; error: string; message: string };

export async function acceptInviteAction(
  orgSlug: string,
  token: string,
): Promise<AcceptInviteResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      error: "sign_in_required",
      message: "Sign in with the email address that received the invite.",
    };
  }

  const { data, error } = await supabase.rpc("accept_organization_invite", {
    p_token: token,
  });

  if (error) {
    return {
      ok: false,
      error: "rpc_error",
      message: error.message,
    };
  }

  const row = data as { ok?: boolean; error?: string } | null;
  if (!row?.ok) {
    const code = row?.error ?? "unknown";
    const messages: Record<string, string> = {
      unauthorized: "You must be signed in to accept this invite.",
      invalid_token: "This invite link is not valid.",
      invalid_or_expired: "This invite has expired or was already used.",
      email_mismatch:
        "Sign in with the same email address the invitation was sent to.",
      already_member: "You are already a member of this organization.",
    };
    return {
      ok: false,
      error: code,
      message: messages[code] ?? "Could not accept the invite.",
    };
  }

  redirect(`/o/${orgSlug}`);
}
