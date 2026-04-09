import { createHash, randomBytes } from "node:crypto";

import { loadOrgContextWithClient } from "@/lib/auth/org-context";
import { assertOwnerOrAdmin } from "@/lib/auth/permissions";
import {
  jsonFromCaughtRouteError,
  validationError,
  validationErrorFromZod,
} from "@/lib/api/errors";
import { organizationInviteSchema } from "@/lib/validations";

type Ctx = { params: Promise<{ orgSlug: string }> };

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function POST(request: Request, context: Ctx) {
  try {
    const { orgSlug } = await context.params;
    const orgCtx = await loadOrgContextWithClient({ orgSlug });
    assertOwnerOrAdmin(orgCtx);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return validationError("Request body must be valid JSON.");
    }

    const parsed = organizationInviteSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorFromZod(parsed.error);
    }

    const { email, role } = parsed.data;
    const { supabase, organizationId, userId, organizationSlug } = orgCtx;

    const { data: existingPending } = await supabase
      .from("invites")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle();

    if (existingPending) {
      return Response.json(
        {
          code: "409_invite_pending",
          message:
            "An invite is already pending for this email. Revoke it or wait for it to expire.",
        },
        { status: 409 },
      );
    }

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken, "utf8").digest("hex");
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();

    const { data, error } = await supabase
      .from("invites")
      .insert({
        organization_id: organizationId,
        email,
        role,
        token_hash: tokenHash,
        invited_by_user_id: userId,
        expires_at: expiresAt,
        status: "pending",
      })
      .select("id, email, role, expires_at, created_at")
      .single();

    if (error) {
      throw error;
    }

    return Response.json(
      {
        invite: {
          id: data.id,
          email: data.email,
          role: data.role,
          expiresAt: data.expires_at,
          createdAt: data.created_at,
          token: rawToken,
          acceptPath: `/o/${organizationSlug}/invite/${rawToken}`,
        },
      },
      { status: 201 },
    );
  } catch (e) {
    return jsonFromCaughtRouteError(e);
  }
}
