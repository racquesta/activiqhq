# Data Model: Kids Activities Class Management Platform

## Organization

- **Fields**
  - `id` (uuid, pk)
  - `slug` (text, unique, global)
  - `name` (text)
  - `created_by_user_id` (uuid, fk -> auth/users)
  - `created_at`, `updated_at` (timestamptz)
- **Rules**
  - `slug` is immutable after creation in MVP.
  - Exactly one owner membership exists per organization in MVP.

## Profile

- **Fields**
  - `user_id` (uuid, pk, fk -> auth/users)
  - `display_name` (text, nullable)
  - `created_at`, `updated_at` (timestamptz)
- **Rules**
  - Created automatically on first auth user creation.

## OrganizationMembership

- **Fields**
  - `id` (uuid, pk)
  - `organization_id` (uuid, fk -> organizations)
  - `user_id` (uuid, fk -> auth/users)
  - `role` (enum type contains owner/admin/instructor/coach/guardian; table enforces staff-only usage)
  - `status` (enum: active, invited, revoked)
  - `permissions_version` (int)
  - `created_at`, `updated_at` (timestamptz)
- **Rules**
  - Unique (`organization_id`, `user_id`).
  - Role + permissions template define capability checks.
  - Guardians are stored in `guardian_memberships` rather than this table.

## RoleTemplate

- **Fields**
  - `id` (uuid, pk)
  - `organization_id` (uuid, fk -> organizations)
  - `role` (enum: admin, instructor, coach)
  - `can_manage_activities` (bool)
  - `can_manage_enrollments` (bool)
  - `can_manage_staff` (bool)
  - `updated_by_user_id` (uuid)
  - `created_at`, `updated_at` (timestamptz)
- **Rules**
  - Unique (`organization_id`, `role`).
  - `owner` permissions are not templated in MVP.

## Invite

- **Fields**
  - `id` (uuid, pk)
  - `organization_id` (uuid, fk -> organizations)
  - `email` (text)
  - `role` (enum: admin, instructor, coach)
  - `token_hash` (text)
  - `status` (enum: pending, accepted, expired, revoked)
  - `invited_by_user_id` (uuid)
  - `expires_at` (timestamptz)
  - `created_at`
- **Rules**
  - Re-inviting an active member with same role becomes no-op/error per API contract.

## GuardianMembership

- **Fields**
  - `id` (uuid, pk)
  - `organization_id` (uuid, fk -> organizations)
  - `user_id` (uuid, fk -> auth/users)
  - `joined_at` (timestamptz)
- **Rules**
  - A user can hold memberships in multiple organizations.
  - URL org slug controls active tenant context.

## ChildProfile

- **Fields**
  - `id` (uuid, pk)
  - `organization_id` (uuid, fk -> organizations)
  - `guardian_user_id` (uuid, fk -> auth/users)
  - `first_name` (text)
  - `birth_date` (date)
  - `created_at`, `updated_at` (timestamptz)
- **Rules**
  - Potential duplicate detection key: (`organization_id`, `first_name`, `birth_date`).
  - Duplicate creation allowed only after explicit confirmation.

## Activity

- **Fields**
  - `id` (uuid, pk)
  - `organization_id` (uuid, fk -> organizations)
  - `title` (text)
  - `activity_type` (text)
  - `starts_at`, `ends_at` (timestamptz)
  - `capacity` (int, nullable)
  - `is_published` (bool)
  - `created_at`, `updated_at`
- **Rules**
  - Unpublished activities cannot be enrolled by guardians.

## EnrollmentPolicy

- **Fields**
  - `organization_id` (uuid, pk, fk -> organizations)
  - `max_concurrent_activities_per_child` (int)
  - `updated_by_user_id` (uuid)
  - `updated_at` (timestamptz)
- **Rules**
  - Minimum value is 1.
  - Enforced on enrollment create requests.

## Enrollment

- **Fields**
  - `id` (uuid, pk)
  - `organization_id` (uuid, fk -> organizations)
  - `activity_id` (uuid, fk -> activities)
  - `child_id` (uuid, fk -> child_profiles)
  - `status` (enum: active, cancelled)
  - `created_at`, `updated_at`
- **Rules**
  - Unique active (`activity_id`, `child_id`).
  - Create fails when org-wide per-child active enrollment count exceeds policy.

## State Transitions

- **Invite**: `pending -> accepted|expired|revoked`
- **Membership**: `invited -> active|revoked`
- **Enrollment**: `active -> cancelled`
