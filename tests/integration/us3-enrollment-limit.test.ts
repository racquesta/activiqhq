import { describe, expect, it } from "vitest";

import { POST as postEnrollment } from "@/app/api/o/[orgSlug]/enrollments/route";

const appBaseUrl =
  process.env.NEXT_PUBLIC_APP_BASE_URL?.replace(/\/+$/, "") ??
  "http://localhost:3001";

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

describe.skip("US3 enrollment limit enforcement integration", () => {
  it("allows enrollment up to policy limit, then blocks additional active enrollment", async () => {
    const first = await postEnrollmentHandler(
      new Request(`${appBaseUrl}/api/o/acme-dance/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: "child-under-limit",
          activityId: "activity-1",
        }),
      }),
      { params: Promise.resolve({ orgSlug: "acme-dance" }) } as never,
    );

    expect(first.status).toBe(201);

    const second = await postEnrollmentHandler(
      new Request(`${appBaseUrl}/api/o/acme-dance/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: "child-under-limit",
          activityId: "activity-2",
        }),
      }),
      { params: Promise.resolve({ orgSlug: "acme-dance" }) } as never,
    );

    expect(second.status).toBe(201);

    const third = await postEnrollmentHandler(
      new Request(`${appBaseUrl}/api/o/acme-dance/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: "child-under-limit",
          activityId: "activity-3",
        }),
      }),
      { params: Promise.resolve({ orgSlug: "acme-dance" }) } as never,
    );

    expect(third.status).toBe(409);
    const body = await readJson(third);
    expect(body.code).toBe("409_enrollment_limit_reached");
  });
});
