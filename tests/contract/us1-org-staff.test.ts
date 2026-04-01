import { describe, expect, it } from "vitest";

import { POST as postOrganization } from "@/app/api/organizations/route";
import { POST as postInvite } from "@/app/api/o/[orgSlug]/invites/route";
import { GET as getRoleTemplates } from "@/app/api/o/[orgSlug]/role-templates/route";
import { PATCH as patchRoleTemplate } from "@/app/api/o/[orgSlug]/role-templates/[role]/route";

/**
 * US1 contract coverage (see `specs/001-kids-activities-platform/contracts/README.md`).
 *
 * Until routes are implemented (T018–T020), handlers return HTTP 501 with a stable
 * `not_implemented` payload. When implementation lands, extend these tests with
 * success paths and contract error codes (`409_slug_conflict`, `422_validation_error`, etc.).
 */

async function readJson(res: Response): Promise<Record<string, unknown>> {
  expect(res.headers.get("content-type")).toMatch(/application\/json/i);
  return (await res.json()) as Record<string, unknown>;
}

describe("US1 org + staff API contract (stubs)", () => {
  it("POST /api/organizations returns JSON with not_implemented until implemented", async () => {
    const res = await postOrganization();
    expect(res.status).toBe(501);
    const body = await readJson(res);
    expect(body.code).toBe("not_implemented");
    expect(typeof body.message).toBe("string");
  });

  it("GET /api/o/{orgSlug}/role-templates returns JSON with not_implemented until implemented", async () => {
    const res = await getRoleTemplates();
    expect(res.status).toBe(501);
    const body = await readJson(res);
    expect(body.code).toBe("not_implemented");
    expect(typeof body.message).toBe("string");
  });

  it("PATCH /api/o/{orgSlug}/role-templates/{role} returns JSON with not_implemented until implemented", async () => {
    const res = await patchRoleTemplate();
    expect(res.status).toBe(501);
    const body = await readJson(res);
    expect(body.code).toBe("not_implemented");
    expect(typeof body.message).toBe("string");
  });

  it("POST /api/o/{orgSlug}/invites returns JSON with not_implemented until implemented", async () => {
    const res = await postInvite();
    expect(res.status).toBe(501);
    const body = await readJson(res);
    expect(body.code).toBe("not_implemented");
    expect(typeof body.message).toBe("string");
  });
});
