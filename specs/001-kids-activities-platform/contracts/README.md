# Contracts: ActiviqHQ (Next.js + Supabase)

This web app primarily exposes behavior through **Server Actions** and a small set of **Route
Handlers** (e.g. webhooks later). External consumers are browsers; there is no separate public REST
API in v1. Contracts here define **boundary shapes** and **naming** so tasks and tests stay aligned.

## Principles

1. **Validation**: Every mutation boundary accepts **Zod**-parsed input; return discriminated unions
   `{ ok: true, data } | { ok: false, error: string, code?: string }` from server actions (or throw
   `redirect` / `notFound` where appropriate).
2. **Authorization**: Callers MUST resolve `organizationId` + `userId` from Supabase session +
   membership before business logic (never trust client-sent org id alone without membership check).
3. **Idempotency**: Invite accept and waitlist “offer confirm” should tolerate double-submit.

## Server action groups (planned)

| Domain | Examples | Notes |
|--------|----------|-------|
| Org & staff | `createOrganization`, `inviteStaff`, `acceptInvitation`, `updateMemberPermissions` | Owner/admin gates |
| Catalog | `upsertActivity`, `publishActivity`, `upsertSession`, `bookFacility` | Facility overlap = hard error |
| Parent | `registerChild`, `requestEnrollment`, `joinWaitlist`, `completeOfferedEnrollment` | Age + capacity checks |
| Auth | wraps Supabase `signInWithPassword`, `signInWithOtp` | Magic link = OTP email |

## HTTP routes (v1)

| Method | Path | Purpose |
|--------|------|--------|
| GET | `/` | Marketing or redirect |
| GET | `/o/[slug]/...` | Example org-scoped surface (exact tree in implement phase) |

Stripe webhook path reserved: `POST /api/webhooks/stripe` (stub, returns 501 until activated).

## Error codes (suggested)

- `ORG_NOT_FOUND`, `FORBIDDEN`, `FACILITY_CONFLICT`, `CAPACITY_FULL`, `AGE_INELIGIBLE`,
  `ENROLLMENT_POLICY_BLOCK`, `WAITLIST_DUPLICATE`, `OFFER_EXPIRED`

Document extensions only with product approval.
