# Contracts: Kids Activities Class Management Platform

This file defines MVP API contracts to keep frontend and backend aligned.

## Base assumptions

- All protected routes require authenticated user context.
- Tenant context is derived from URL slug (`/o/{orgSlug}`) and verified against membership.
- JSON request/response format.

## Endpoints

### Organizations

- `POST /api/organizations`
  - Create organization with globally unique slug.
  - Creates owner membership for current user.

### Staff permissions and invites

- `GET /api/o/{orgSlug}/role-templates`
- `PATCH /api/o/{orgSlug}/role-templates/{role}`
  - Update limited capability toggles for `admin` or `instructor/coach`.
- `POST /api/o/{orgSlug}/invites`
  - Invite staff with role `admin|instructor|coach`.

### Guardian onboarding

- `POST /api/o/{orgSlug}/guardians/join`
  - Link current guardian user to organization membership.

### Child profiles

- `POST /api/o/{orgSlug}/children`
  - Accepts `firstName`, `birthDate`, optional `confirmDuplicate`.
  - If potential duplicate exists and `confirmDuplicate` is false/missing, return warning.

### Enrollment policy

- `GET /api/o/{orgSlug}/enrollment-policy`
- `PATCH /api/o/{orgSlug}/enrollment-policy`
  - Set org-wide max concurrent activities per child.

### Activities and enrollments

- `GET /api/o/{orgSlug}/activities?eligibleForChildId={id}`
- `POST /api/o/{orgSlug}/enrollments`
  - Enforces policy limit and activity eligibility.

## Error contract (minimum)

- `403_forbidden_tenant_access`
- `404_organization_not_found`
- `409_slug_conflict`
- `409_duplicate_child_confirmation_required`
- `409_enrollment_limit_reached`
- `422_validation_error`
