import type { User } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  GET as getEnrollmentPolicy,
  PATCH as patchEnrollmentPolicy,
} from "@/app/api/o/[orgSlug]/enrollment-policy/route";
import { POST as postEnrollment } from "@/app/api/o/[orgSlug]/enrollments/route";
import { loadOrgContextWithClient } from "@/lib/auth/org-context";
import { requireUserOrThrow } from "@/lib/auth/require-user";

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

const orgId = "22222222-2222-4222-8222-222222222222";
const childId = "10000000-0000-4000-8000-000000000001";
const activityIdLimit = "30000000-0000-4000-8000-000000000003";

function orgCtx(
  overrides: Partial<{
    role: "owner" | "admin" | "instructor" | "coach" | "guardian_member";
    isStaff: boolean;
    isGuardian: boolean;
    supabase: object;
  }> = {},
) {
  const supabase =
    (overrides.supabase as Record<string, unknown> | undefined) ?? {};
  return {
    organizationId: orgId,
    organizationSlug: "acme-dance",
    organizationName: "Acme Dance",
    userId: mockUser.id,
    role: overrides.role ?? ("admin" as const),
    isStaff: overrides.isStaff ?? true,
    isGuardian: overrides.isGuardian ?? false,
    supabase: supabase as never,
  };
}

type OrgSlugContext = { params: Promise<{ orgSlug: string }> };
type RouteHandler = (request: Request, context: OrgSlugContext) => Promise<Response>;

const getEnrollmentPolicyHandler = getEnrollmentPolicy as unknown as RouteHandler;
const patchEnrollmentPolicyHandler = patchEnrollmentPolicy as unknown as RouteHandler;
const postEnrollmentHandler = postEnrollment as unknown as RouteHandler;

async function readJson(res: Response): Promise<Record<string, unknown>> {
  expect(res.headers.get("content-type")).toMatch(/application\/json/i);
  return (await res.json()) as Record<string, unknown>;
}

describe("enrollment policy + enrollment API contract", () => {
  beforeEach(() => {
    vi.mocked(loadOrgContextWithClient).mockReset();
    vi.mocked(requireUserOrThrow).mockReset();
  });

  it("GET /api/o/{orgSlug}/enrollment-policy returns policy payload", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                max_concurrent_activities_per_child: 2,
                updated_at: "2026-01-01T00:00:00Z",
                updated_by_user_id: mockUser.id,
              },
              error: null,
            }),
          })),
        })),
      })),
    };
    vi.mocked(loadOrgContextWithClient).mockResolvedValue(orgCtx({ supabase }));

    const res = await getEnrollmentPolicyHandler(
      new Request("http://localhost/api/o/acme-dance/enrollment-policy"),
      { params: Promise.resolve({ orgSlug: "acme-dance" }) } as never,
    );

    expect(res.status).toBe(200);
    const body = await readJson(res);
    expect(typeof body.maxConcurrentActivitiesPerChild).toBe("number");
  });

  it("PATCH /api/o/{orgSlug}/enrollment-policy validates minimum bound", async () => {
    vi.mocked(loadOrgContextWithClient).mockResolvedValue(orgCtx());

    const res = await patchEnrollmentPolicyHandler(
      new Request("http://localhost/api/o/acme-dance/enrollment-policy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxConcurrentActivitiesPerChild: 0 }),
      }),
      { params: Promise.resolve({ orgSlug: "acme-dance" }) } as never,
    );

    expect(res.status).toBe(422);
    const body = await readJson(res);
    expect(body.code).toBe("422_validation_error");
  });

  it("PATCH /api/o/{orgSlug}/enrollment-policy updates policy for staff manager", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        max_concurrent_activities_per_child: 2,
        updated_at: "2026-01-02T00:00:00Z",
        updated_by_user_id: mockUser.id,
      },
      error: null,
    });
    const supabase = {
      from: vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({ single })),
          })),
        })),
      })),
    };
    vi.mocked(loadOrgContextWithClient).mockResolvedValue(orgCtx({ supabase }));

    const res = await patchEnrollmentPolicyHandler(
      new Request("http://localhost/api/o/acme-dance/enrollment-policy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxConcurrentActivitiesPerChild: 2 }),
      }),
      { params: Promise.resolve({ orgSlug: "acme-dance" }) } as never,
    );

    expect(res.status).toBe(200);
    const body = await readJson(res);
    expect(body.maxConcurrentActivitiesPerChild).toBe(2);
  });

  it("POST /api/o/{orgSlug}/enrollments rejects when org limit reached", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "enrollment_policies") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { max_concurrent_activities_per_child: 2 },
                  error: null,
                }),
              })),
            })),
          };
        }
        if (table === "child_profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: childId,
                      guardian_user_id: mockUser.id,
                    },
                    error: null,
                  }),
                })),
              })),
            })),
          };
        }
        if (table === "activities") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: {
                      id: activityIdLimit,
                      is_published: true,
                      organization_id: orgId,
                    },
                    error: null,
                  }),
                })),
              })),
            })),
          };
        }
        if (table === "enrollments") {
          return {
            select: vi.fn((cols: string, opts?: { count?: string; head?: boolean }) => {
              if (opts?.head) {
                return {
                  eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                      eq: vi.fn().mockResolvedValue({ count: 2, error: null }),
                    })),
                  })),
                };
              }
              return {
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                      eq: vi.fn(() => ({
                        maybeSingle: vi.fn().mockResolvedValue({
                          data: null,
                          error: null,
                        }),
                      })),
                    })),
                  })),
                })),
              };
            }),
          };
        }
        return {};
      }),
    };

    vi.mocked(loadOrgContextWithClient).mockResolvedValue(
      orgCtx({
        role: "guardian_member",
        isStaff: false,
        isGuardian: true,
        supabase,
      }),
    );

    const res = await postEnrollmentHandler(
      new Request("http://localhost/api/o/acme-dance/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          activityId: activityIdLimit,
        }),
      }),
      { params: Promise.resolve({ orgSlug: "acme-dance" }) } as never,
    );

    expect(res.status).toBe(409);
    const body = await readJson(res);
    expect(body.code).toBe("409_enrollment_limit_reached");
  });
});
