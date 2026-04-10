import { describe, expect, it } from "vitest";

import {
  GET as getEnrollmentPolicy,
  PATCH as patchEnrollmentPolicy,
} from "@/app/api/o/[orgSlug]/enrollment-policy/route";
import { POST as postEnrollment } from "@/app/api/o/[orgSlug]/enrollments/route";

const appBaseUrl =
  process.env.NEXT_PUBLIC_APP_BASE_URL?.replace(/\/+$/, "") ??
  "http://localhost:3001";

type OrgSlugContext = { params: Promise<{ orgSlug: string }> };
type RouteHandler = (request: Request, context: OrgSlugContext) => Promise<Response>;

const getEnrollmentPolicyHandler = getEnrollmentPolicy as unknown as RouteHandler;
const patchEnrollmentPolicyHandler = patchEnrollmentPolicy as unknown as RouteHandler;
const postEnrollmentHandler = postEnrollment as unknown as RouteHandler;

async function readJson(res: Response): Promise<Record<string, unknown>> {
  expect(res.headers.get("content-type")).toMatch(/application\/json/i);
  return (await res.json()) as Record<string, unknown>;
}

describe.skip("enrollment policy + enrollment API contract", () => {
  it("GET /api/o/{orgSlug}/enrollment-policy returns policy payload", async () => {
    const res = await getEnrollmentPolicyHandler(
      new Request(`${appBaseUrl}/api/o/acme-dance/enrollment-policy`),
      { params: Promise.resolve({ orgSlug: "acme-dance" }) } as never,
    );

    expect(res.status).toBe(200);
    const body = await readJson(res);
    expect(typeof body.maxConcurrentActivitiesPerChild).toBe("number");
  });

  it("PATCH /api/o/{orgSlug}/enrollment-policy validates minimum bound", async () => {
    const res = await patchEnrollmentPolicyHandler(
      new Request(`${appBaseUrl}/api/o/acme-dance/enrollment-policy`, {
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
    const res = await patchEnrollmentPolicyHandler(
      new Request(`${appBaseUrl}/api/o/acme-dance/enrollment-policy`, {
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
    const res = await postEnrollmentHandler(
      new Request(`${appBaseUrl}/api/o/acme-dance/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: "child-1",
          activityId: "activity-3",
        }),
      }),
      { params: Promise.resolve({ orgSlug: "acme-dance" }) } as never,
    );

    expect(res.status).toBe(409);
    const body = await readJson(res);
    expect(body.code).toBe("409_enrollment_limit_reached");
  });
});
