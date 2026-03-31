import { z } from "zod";

/** Align with `specs/001-kids-activities-platform/contracts/README.md` */
export const ERROR_CODES = {
  ORG_NOT_FOUND: "ORG_NOT_FOUND",
  FORBIDDEN: "FORBIDDEN",
  FACILITY_CONFLICT: "FACILITY_CONFLICT",
  CAPACITY_FULL: "CAPACITY_FULL",
  AGE_INELIGIBLE: "AGE_INELIGIBLE",
  ENROLLMENT_POLICY_BLOCK: "ENROLLMENT_POLICY_BLOCK",
  WAITLIST_DUPLICATE: "WAITLIST_DUPLICATE",
  OFFER_EXPIRED: "OFFER_EXPIRED",
  DELETION_BLOCKED_ACTIVE_ENROLLMENT: "DELETION_BLOCKED_ACTIVE_ENROLLMENT",
} as const;

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

export function actionOk<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function actionError(error: string, code?: string): ActionResult<never> {
  return { ok: false, error, code };
}

/** Shared helper for Zod-safe server action boundaries */
export function parseActionInput<T extends z.ZodType>(
  schema: T,
  input: unknown
): { ok: true; data: z.infer<T> } | { ok: false; error: string; code?: string } {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.flatten().formErrors.join("; ") || "Invalid input",
    };
  }
  return { ok: true, data: parsed.data };
}
