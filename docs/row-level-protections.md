# Row-Level Protections Summary

This document summarizes table-level row protections defined in:

- `supabase/migrations/20260331170000_rls.sql`

## Helper functions used by policies

- `public.is_org_member(target_org_id uuid)`
  - Returns true when `auth.uid()` is an active org membership user or a guardian membership user for the target org.
- `public.has_org_role(target_org_id uuid, allowed_roles membership_role[])`
  - Returns true when `auth.uid()` has an active org membership with one of the allowed roles.

## Table-by-table summary

### `public.organizations`

- **Data / usage**: Stores each tenant organization (name, slug, creator). Used as the top-level
  boundary for routing, membership, and all org-scoped data.
- **SELECT**: Allowed for users who are members of the org (`is_org_member(id)`).
- **INSERT**: Allowed only when `created_by_user_id = auth.uid()`.
- **UPDATE**: Allowed only for org `owner` or `admin`.

### `public.profiles`

- **Data / usage**: Stores user profile metadata tied to `auth.users` (for example display name).
  Used for account-level identity details in the app.
- **SELECT**: Self-only (`user_id = auth.uid()`).
- **INSERT**: Self-only.
- **UPDATE**: Self-only.

### `public.organization_memberships`

- **Data / usage**: Stores staff and guardian membership rows per organization, including role,
  status, and permission version. Used to authorize org-level access.
- **SELECT**:
  - Allowed for staff roles (`owner`, `admin`, `instructor`, `coach`) to view all memberships in the org.
  - Guardians can view only their own membership rows (`user_id = auth.uid()`).
- **INSERT**: Allowed for org `owner` or `admin`.
- **UPDATE**: Allowed for org `owner` or `admin`.

### `public.invites`

- **Data / usage**: Stores invitation records for adding staff users to an organization
  (`admin`, `instructor`, `coach`). Used by invite acceptance and onboarding flows.
- **SELECT**: Allowed for org `owner` or `admin`.
- **INSERT**: Allowed for org `owner` or `admin`, and `invited_by_user_id` must equal `auth.uid()`.
- **UPDATE**: Allowed for org `owner` or `admin`.

### `public.guardian_memberships`

- **Data / usage**: Stores guardian-to-organization links. Used to support one guardian account
  belonging to multiple organizations.
- **SELECT**: Allowed for org members.
- **INSERT**:
  - Allowed when `user_id = auth.uid()` (self-join), or
  - Allowed for org `owner` or `admin`.

### `public.child_profiles`

- **Data / usage**: Stores child records per organization (first name and birth date, guardian
  owner). Used by enrollment and guardian child management workflows.
- **SELECT**:
  - Staff (`owner`, `admin`, `instructor`, `coach`) may read all child profiles in the org.
  - Guardians may read only profiles where they are the guardian (`guardian_user_id = auth.uid()`).
- **INSERT**:
  - Allowed for the guardian user creating their own child profile in that org, or
  - Allowed for org `owner` or `admin`.
- **UPDATE**:
  - Allowed for the guardian owner of the child profile, or
  - Allowed for org `owner` or `admin`.

### `public.activities`

- **Data / usage**: Stores class/activity offerings for each organization (schedule, type,
  publish state, capacity). Used to power discovery and registration.
- **SELECT**: Allowed for org members.
- **INSERT**: Allowed only for org `owner` or `admin`.
- **UPDATE**: Allowed only for org `owner` or `admin`.

### `public.enrollments`

- **Data / usage**: Stores child-to-activity registrations and status (`active`/`cancelled`).
  Used to enforce enrollment rules and track participation.
- **SELECT**:
  - Staff (`owner`, `admin`, `instructor`, `coach`) may read all enrollments in the org.
  - Guardians may read only enrollments for their own children (via `child_profiles.guardian_user_id`).
- **INSERT**:
  - Allowed for org `owner` or `admin`, or
  - Allowed for guardians enrolling children they own in that org.
- **UPDATE**:
  - Allowed for org `owner` or `admin`, or
  - Allowed for guardians when the enrollment's child belongs to them in that org.

### `public.role_templates`

- **Data / usage**: Stores per-organization permission templates for staff roles. Used to
  control allowed capabilities without per-user ACL complexity.
- **SELECT**: Allowed for org members.
- **ALL (INSERT/UPDATE/DELETE)**: Allowed for org `owner` or `admin`.

### `public.enrollment_policies`

- **Data / usage**: Stores the org-wide enrollment rule set (for example max concurrent
  activities per child). Used during enrollment validation.
- **SELECT**: Allowed for org members.
- **ALL (INSERT/UPDATE/DELETE)**: Allowed for org `owner` or `admin`.

## Notes

- All listed tables have RLS enabled in `20260331170000_rls.sql`.
- The migration currently defines policies for SELECT/INSERT/UPDATE broadly; delete policies are only implicitly covered where `FOR ALL` is used.
- Effective access depends on authenticated context (`auth.uid()`), active membership status, and role checks.
