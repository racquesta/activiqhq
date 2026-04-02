import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Exercises `public.role_templates` capability toggles against a real Postgres instance
 * (local Supabase). See `specs/001-kids-activities-platform/quickstart.md` — set
 * `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `npm run db:status`.
 *
 * When those env vars are missing (e.g. CI without Supabase), this suite is skipped.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const hasSupabaseIntegrationEnv = Boolean(url && serviceKey);

describe.skipIf(!hasSupabaseIntegrationEnv)(
  "US1 role template toggle behavior (Supabase integration)",
  () => {
    let supabase: SupabaseClient | undefined;
    let orgId: string | undefined;
    let ownerUserId: string | undefined;
    const runId = `rt-${Date.now()}`;

    beforeAll(async () => {
      supabase = createClient(url!, serviceKey!, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      const email = `${runId}@activiq.test`;
      const { data: created, error: userErr } =
        await supabase.auth.admin.createUser({
          email,
          password: "TestPassword123!@#",
          email_confirm: true,
        });
      if (userErr || !created.user) {
        throw userErr ?? new Error("createUser returned no user");
      }
      ownerUserId = created.user.id;

      const slug = `${runId}-org`;
      const { data: org, error: orgErr } = await supabase
        .from("organizations")
        .insert({
          slug,
          name: "Role template integration org",
          created_by_user_id: ownerUserId,
        })
        .select("id")
        .single();
      if (orgErr || !org) {
        throw orgErr ?? new Error("organization insert failed");
      }
      orgId = org.id;

      const { error: rtErr } = await supabase.from("role_templates").insert([
        {
          organization_id: orgId,
          role: "admin",
          can_manage_activities: false,
          can_manage_enrollments: false,
          can_manage_staff: false,
          updated_by_user_id: ownerUserId,
        },
        {
          organization_id: orgId,
          role: "instructor",
          can_manage_activities: false,
          can_manage_enrollments: false,
          can_manage_staff: false,
          updated_by_user_id: ownerUserId,
        },
      ]);
      if (rtErr) {
        throw rtErr;
      }
    });

    afterAll(async () => {
      if (!supabase) return;
      if (orgId) {
        await supabase.from("organizations").delete().eq("id", orgId);
      }
      if (ownerUserId) {
        await supabase.auth.admin.deleteUser(ownerUserId);
      }
    });

    it("persists admin capability toggles on update", async () => {
      const db = supabase!;
      const { error: upErr } = await db
        .from("role_templates")
        .update({
          can_manage_activities: true,
          can_manage_enrollments: true,
          can_manage_staff: false,
          updated_by_user_id: ownerUserId,
        })
        .eq("organization_id", orgId!)
        .eq("role", "admin");
      expect(upErr).toBeNull();

      const { data: row, error: selErr } = await db
        .from("role_templates")
        .select(
          "can_manage_activities, can_manage_enrollments, can_manage_staff",
        )
        .eq("organization_id", orgId!)
        .eq("role", "admin")
        .single();

      expect(selErr).toBeNull();
      expect(row?.can_manage_activities).toBe(true);
      expect(row?.can_manage_enrollments).toBe(true);
      expect(row?.can_manage_staff).toBe(false);
    });

    it("keeps instructor template toggles independent from admin", async () => {
      const db = supabase!;
      await db
        .from("role_templates")
        .update({
          can_manage_staff: true,
          updated_by_user_id: ownerUserId,
        })
        .eq("organization_id", orgId!)
        .eq("role", "instructor");

      const { data: adminRow } = await db
        .from("role_templates")
        .select("can_manage_staff")
        .eq("organization_id", orgId!)
        .eq("role", "admin")
        .single();

      const { data: instRow } = await supabase
        .from("role_templates")
        .select("can_manage_staff")
        .eq("organization_id", orgId!)
        .eq("role", "instructor")
        .single();

      expect(adminRow?.can_manage_staff).toBe(false);
      expect(instRow?.can_manage_staff).toBe(true);
    });
  },
);
