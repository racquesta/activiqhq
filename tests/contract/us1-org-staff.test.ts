import type { User } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as postOrganization } from "@/app/api/organizations/route";
import { POST as postInvite } from "@/app/api/o/[orgSlug]/invites/route";
import { GET as getRoleTemplates } from "@/app/api/o/[orgSlug]/role-templates/route";
import { PATCH as patchRoleTemplate } from "@/app/api/o/[orgSlug]/role-templates/[role]/route";
import { loadOrgContextWithClient } from "@/lib/auth/org-context";
import {
  requireUserOrThrow,
  UnauthorizedError,
} from "@/lib/auth/require-user";

vi.mock("@/lib/auth/require-user", () => ({
  requireUserOrThrow: vi.fn(),
  UnauthorizedError: class UnauthorizedError extends Error {
    readonly status = 401;
    constructor(message = "Unauthorized") {
      super(message);
      this.name = "UnauthorizedError";
    }
  },
}));

vi.mock("@/lib/auth/org-context", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/org-context")>(
    "@/lib/auth/org-context",
  );
  return {
    ...actual,
    loadOrgContextWithClient: vi.fn(),
  };
});

const mockUser = { id: "11111111-1111-1111-1111-111111111111" } as User;

function orgCtx(
  overrides: Partial<{
    role: "owner" | "admin" | "instructor" | "coach" | "guardian_member";
    supabase: object;
  }> = {},
) {
  const supabase =
    (overrides.supabase as Record<string, unknown> | undefined) ?? {};
  return {
    organizationId: "22222222-2222-2222-2222-222222222222",
    organizationSlug: "acme-dance",
    organizationName: "Acme Dance",
    userId: mockUser.id,
    role: overrides.role ?? ("owner" as const),
    isStaff: true,
    isGuardian: false,
    supabase: supabase as never,
  };
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  expect(res.headers.get("content-type")).toMatch(/application\/json/i);
  return (await res.json()) as Record<string, unknown>;
}

describe("US1 org + staff API contract", () => {
  beforeEach(() => {
    vi.mocked(loadOrgContextWithClient).mockReset();
    vi.mocked(requireUserOrThrow).mockReset();
  });

  it("POST /api/organizations returns 401 when unauthenticated", async () => {
    vi.mocked(requireUserOrThrow).mockRejectedValue(new UnauthorizedError());
    const res = await postOrganization(
      new Request("http://localhost/api/organizations", { method: "POST" }),
    );
    expect(res.status).toBe(401);
  });

  it("POST /api/organizations returns 201 with organization payload", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: "33333333-3333-3333-3333-333333333333",
        slug: "acme-dance",
        name: "Acme Dance",
      },
      error: null,
    });
    const supabase = {
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({ single })),
        })),
      })),
    };
    vi.mocked(requireUserOrThrow).mockResolvedValue({
      user: mockUser,
      supabase: supabase as never,
    });

    const res = await postOrganization(
      new Request("http://localhost/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Acme Dance", slug: "acme-dance" }),
      }),
    );
    expect(res.status).toBe(201);
    const body = await readJson(res);
    expect(body.slug).toBe("acme-dance");
    expect(body.name).toBe("Acme Dance");
  });

  it("POST /api/organizations returns 409_slug_conflict on unique violation", async () => {
    const single = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "23505", message: "duplicate" },
    });
    const supabase = {
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({ single })),
        })),
      })),
    };
    vi.mocked(requireUserOrThrow).mockResolvedValue({
      user: mockUser,
      supabase: supabase as never,
    });

    const res = await postOrganization(
      new Request("http://localhost/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Acme Dance", slug: "taken-slug" }),
      }),
    );
    expect(res.status).toBe(409);
    const body = await readJson(res);
    expect(body.code).toBe("409_slug_conflict");
  });

  it("GET /api/o/{orgSlug}/role-templates returns templates", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "1",
                  role: "admin",
                  can_manage_activities: false,
                  can_manage_enrollments: false,
                  can_manage_staff: false,
                  updated_at: "2026-01-01T00:00:00Z",
                },
              ],
              error: null,
            }),
          })),
        })),
      })),
    };
    vi.mocked(loadOrgContextWithClient).mockResolvedValue(orgCtx({ supabase }));

    const res = await getRoleTemplates(
      new Request("http://localhost/api/o/acme-dance/role-templates"),
      { params: Promise.resolve({ orgSlug: "acme-dance" }) },
    );
    expect(res.status).toBe(200);
    const body = await readJson(res);
    expect(Array.isArray(body.templates)).toBe(true);
    expect((body.templates as unknown[]).length).toBe(1);
  });

  it("PATCH /api/o/{orgSlug}/role-templates/{role} updates template", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: "1",
        role: "admin",
        can_manage_activities: true,
        can_manage_enrollments: false,
        can_manage_staff: false,
        updated_at: "2026-01-01T00:00:00Z",
      },
      error: null,
    });
    const supabase = {
      from: vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({ single })),
            })),
          })),
        })),
      })),
    };
    vi.mocked(loadOrgContextWithClient).mockResolvedValue(orgCtx({ supabase }));

    const res = await patchRoleTemplate(
      new Request("http://localhost/api/o/acme-dance/role-templates/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canManageActivities: true }),
      }),
      { params: Promise.resolve({ orgSlug: "acme-dance", role: "admin" }) },
    );
    expect(res.status).toBe(200);
    const body = await readJson(res);
    expect((body.template as { role?: string }).role).toBe("admin");
  });

  it("POST /api/o/{orgSlug}/invites returns 201 with invite payload", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: "44444444-4444-4444-4444-444444444444",
        email: "coach@example.com",
        role: "instructor",
        expires_at: "2026-12-31T00:00:00.000Z",
        created_at: "2026-01-01T00:00:00.000Z",
      },
      error: null,
    });
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "invites") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({ maybeSingle })),
                })),
              })),
            })),
            insert: vi.fn(() => ({
              select: vi.fn(() => ({ single })),
            })),
          };
        }
        return {};
      }),
    };
    vi.mocked(loadOrgContextWithClient).mockResolvedValue(orgCtx({ supabase }));

    const res = await postInvite(
      new Request("http://localhost/api/o/acme-dance/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "coach@example.com",
          role: "instructor",
        }),
      }),
      { params: Promise.resolve({ orgSlug: "acme-dance" }) },
    );
    expect(res.status).toBe(201);
    const body = await readJson(res);
    const invite = body.invite as Record<string, unknown>;
    expect(invite.email).toBe("coach@example.com");
    expect(typeof invite.token).toBe("string");
    expect(invite.acceptPath).toMatch(/^\/o\/acme-dance\/invite\//);
  });
});
