/**
 * Shared Zod schemas for HTTP request bodies (org, staff invites, members, guardians, children,
 * enrollments). Used in API routes to validate request bodies.
 *
 * Usage in App Router API routes:
 * - `const parsed = someSchema.safeParse(await request.json());`
 * - If `parsed.success` is false, respond with `422_validation_error` (or your standard error
 *   shape) using `parsed.error`.
 * - If true, use `parsed.data` — it is narrowed to the inferred type exported below.
 *
 * Re-export entry: `lib/validations/index.ts`.
 */
import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export const organizationCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().regex(slugPattern).min(3).max(64),
});

export const organizationInviteSchema = z.object({
  email: z.email().trim().toLowerCase(),
  role: z.enum(["admin", "instructor", "coach"]),
});

export const organizationMemberStatusSchema = z.enum([
  "active",
  "invited",
  "revoked",
]);

export const organizationMemberUpdateSchema = z
  .object({
    role: z.enum(["owner", "admin", "instructor", "coach", "guardian"]).optional(),
    status: organizationMemberStatusSchema.optional(),
    permissionsVersion: z.int().nonnegative().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one member field must be provided",
  });

export const guardianJoinSchema = z.object({
  agreeToTerms: z.boolean().optional().default(true),
});

export const childCreateSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  birthDate: z
    .string()
    .regex(datePattern, "birthDate must use YYYY-MM-DD format"),
  confirmDuplicate: z.boolean().optional().default(false),
});

export const enrollmentCreateSchema = z.object({
  activityId: z.uuid(),
  childId: z.uuid(),
});

export type OrganizationCreateInput = z.infer<typeof organizationCreateSchema>;
export type OrganizationInviteInput = z.infer<typeof organizationInviteSchema>;
export type OrganizationMemberUpdateInput = z.infer<
  typeof organizationMemberUpdateSchema
>;
export type GuardianJoinInput = z.infer<typeof guardianJoinSchema>;
export type ChildCreateInput = z.infer<typeof childCreateSchema>;
export type EnrollmentCreateInput = z.infer<typeof enrollmentCreateSchema>;
