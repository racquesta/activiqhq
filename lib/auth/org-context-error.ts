/** Split from `org-context.ts` so API error helpers can import without `server-only` (Vitest). */

export class OrgContextError extends Error {
  readonly status: number;
  readonly code:
    | "missing_org_slug"
    | "organization_not_found"
    | "forbidden_tenant_access";

  constructor(
    code: OrgContextError["code"],
    status: number,
    message = "Organization context error",
  ) {
    super(message);
    this.name = "OrgContextError";
    this.status = status;
    this.code = code;
  }
}
