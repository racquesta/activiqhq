import type { User } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as postEnrollment } from "@/app/api/o/[orgSlug]/enrollments/route";
import { loadOrgContextWithClient } from "@/lib/auth/org-context";

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
const childId = "10000000-0000-4000-8000-0000000000aa";
const activity1 = "20000000-0000-4000-8000-000000000001";
const activity2 = "20000000-0000-4000-8000-000000000002";
const activity3 = "20000000-0000-4000-8000-000000000003";

type Enr = {
  id: string;
  organization_id: string;
  activity_id: string;
  child_id: string;
  status: string;
  created_at: string;
};

type OrgSlugContext = { params: Promise<{ orgSlug: string }> };
type EnrollmentRouteHandler = (
  request: Request,
  context: OrgSlugContext,
) => Promise<Response>;

const postEnrollmentHandler = postEnrollment as unknown as EnrollmentRouteHandler;

async function readJson(res: Response): Promise<Record<string, unknown>> {
  expect(res.headers.get("content-type")).toMatch(/application\/json/i);
  return (await res.json()) as Record<string, unknown>;
}

describe("US3 enrollment limit enforcement integration", () => {
  beforeEach(() => {
    vi.mocked(loadOrgContextWithClient).mockReset();
  });

  it("allows enrollment up to policy limit, then blocks additional active enrollment", async () => {
    const rows: Enr[] = [];
    let idCounter = 0;
    let activityIdToReturn = activity1;

    function activeCount() {
      return rows.filter((r) => r.child_id === childId && r.status === "active")
        .length;
    }

    function activityRow(id: string) {
      return {
        id,
        is_published: true,
        organization_id: orgId,
      };
    }

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
                    data: { id: childId, guardian_user_id: mockUser.id },
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
                  maybeSingle: vi.fn().mockImplementation(async () => ({
                    data: activityRow(activityIdToReturn),
                    error: null,
                  })),
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
                      eq: vi.fn().mockResolvedValue({
                        count: activeCount(),
                        error: null,
                      }),
                    })),
                  })),
                };
              }
              return {
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                      eq: vi.fn(() => ({
                        maybeSingle: vi.fn().mockImplementation(async () => {
                          return {
                            data: null,
                            error: null,
                          };
                        }),
                      })),
                    })),
                  })),
                })),
              };
            }),
            insert: vi.fn(
              (payload: {
                organization_id: string;
                activity_id: string;
                child_id: string;
                status: string;
              }) => ({
                select: vi.fn(() => ({
                  single: vi.fn().mockImplementation(async () => {
                    idCounter += 1;
                    const row: Enr = {
                      id: `enr-${idCounter}`,
                      organization_id: payload.organization_id,
                      activity_id: payload.activity_id,
                      child_id: payload.child_id,
                      status: payload.status,
                      created_at: new Date().toISOString(),
                    };
                    rows.push(row);
                    return { data: row, error: null };
                  }),
                })),
              }),
            ),
          };
        }
        return {};
      }),
    };

    vi.mocked(loadOrgContextWithClient).mockResolvedValue({
      organizationId: orgId,
      organizationSlug: "acme-dance",
      organizationName: "Acme",
      userId: mockUser.id,
      role: "guardian_member",
      isStaff: false,
      isGuardian: true,
      supabase: supabase as never,
    });

    const first = await postEnrollmentHandler(
      new Request("http://localhost/api/o/acme-dance/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          activityId: activity1,
        }),
      }),
      { params: Promise.resolve({ orgSlug: "acme-dance" }) } as never,
    );
    expect(first.status).toBe(201);

    activityIdToReturn = activity2;
    const second = await postEnrollmentHandler(
      new Request("http://localhost/api/o/acme-dance/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          activityId: activity2,
        }),
      }),
      { params: Promise.resolve({ orgSlug: "acme-dance" }) } as never,
    );
    expect(second.status).toBe(201);

    activityIdToReturn = activity3;
    const third = await postEnrollmentHandler(
      new Request("http://localhost/api/o/acme-dance/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          activityId: activity3,
        }),
      }),
      { params: Promise.resolve({ orgSlug: "acme-dance" }) } as never,
    );

    expect(third.status).toBe(409);
    const body = await readJson(third);
    expect(body.code).toBe("409_enrollment_limit_reached");
  });
});
