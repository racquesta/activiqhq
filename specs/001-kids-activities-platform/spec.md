# Feature Specification: Kids Activities Class Management Platform

**Feature Branch**: `001-kids-activities-platform`  
**Created**: 2026-03-31  
**Status**: Draft  
**Input**: User description from `.specstory/history/2026-03-30_23-48-58Z-clean-code-practices-and-guidelines.md` lines 475-485

## Clarifications

### Session 2026-03-31

- Q: How should admin-configurable staff permissions work for MVP? → A: Role templates with limited customization by admin.
- Q: How should dedicated organization sign-in URLs be structured? → A: Slug-based URL with globally unique organization slug.
- Q: How should child enrollment activity limits be defined? → A: Organization-configured org-wide limit per child.
- Q: Can a guardian account belong to multiple organizations? → A: Yes, one guardian account can belong to multiple organizations.
- Q: How should duplicate child profiles be handled? → A: Warn on potential duplicate and require explicit confirmation.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Organization setup and staff management (Priority: P1)

As an organization owner, I can create an organization and invite staff so the
organization can operate classes with role-based access.

**Why this priority**: No classes can be created or managed until organization ownership
and core staff permissions exist.

**Independent Test**: Create an organization, invite admin/instructor/coach users, and
verify each role can access only allowed management screens/actions.

**Acceptance Scenarios**:

1. **Given** an authenticated owner, **When** they create an organization, **Then** the
   system stores the organization and marks that user as owner.
2. **Given** an owner or admin, **When** they invite staff as admin/instructor/coach,
   **Then** invited users are assigned role-based permissions after accepting invite.

---

### User Story 2 - Guardian and child registration via org URL (Priority: P1)

As a parent/guardian, I can register through an organization-specific sign-in URL and add
my child profile so I can browse and enroll in activities.

**Why this priority**: Guardian onboarding is essential for class enrollment and direct
customer value.

**Independent Test**: Open org sign-in URL, create guardian account, add child with first
name and birthday only, then confirm child appears in guardian account.

**Acceptance Scenarios**:

1. **Given** a valid organization URL, **When** a guardian signs up, **Then** the guardian
   account is linked to that organization context.
2. **Given** a guardian account, **When** a guardian adds a child with first name and
   birthday, **Then** the child profile is saved with only those required fields.

---

### User Story 3 - Activity discovery and enrollment rules (Priority: P2)

As a guardian, I can view available activities for my child and enroll based on organization
limits so registration follows business rules.

**Why this priority**: Enrollment is a core business outcome but depends on setup and
guardian onboarding.

**Independent Test**: Admin defines activity enrollment limits, guardian browses activities,
and enrolls child while system enforces limit rules.

**Acceptance Scenarios**:

1. **Given** an admin-defined enrollment limit, **When** a guardian attempts enrollment,
   **Then** the system allows enrollments up to the limit and blocks additional attempts.
2. **Given** published activities, **When** a guardian views available offerings, **Then**
   only eligible/enrollable activities are shown.

---

### Edge Cases

- When a guardian belongs to multiple organizations, the organization in the URL MUST be used
  as the active tenant context for browsing and enrollment.
- Potential duplicate child records (exact first name + birthday in same organization) MUST
  trigger a warning and explicit guardian confirmation before profile creation.
- What happens when an invite is sent to an email that already has a role in the organization?
- How does system handle role changes for users currently managing classes?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a user to create organizations and become owner of each
  created organization.
- **FR-002**: System MUST allow organization owner/admin to invite users as `admin`,
  `instructor`, or `coach`.
- **FR-003**: System MUST enforce role-based access so views/actions differ by assigned role
  and configured role template.
- **FR-004**: System MUST provide each organization a dedicated slug-based sign-in URL
  (`/o/{org-slug}`) for guardian onboarding.
- **FR-005**: System MUST allow guardians to register through organization URL and create an
  account linked to that organization.
- **FR-013**: System MUST allow one guardian account to hold memberships across multiple
  organizations.
- **FR-006**: System MUST allow guardians to add child profiles with first name and birthday.
- **FR-014**: System MUST detect potential duplicate child profiles (exact first name +
  birthday within organization) and require guardian confirmation before saving.
- **FR-007**: System MUST allow guardians to browse available activities for their children.
- **FR-008**: System MUST allow each organization to define an org-wide maximum number of
  concurrent activity enrollments per child.
- **FR-009**: System MUST enforce enrollment limits during guardian registration flows.
- **FR-010**: System MUST treat instructor and coach as equivalent permission levels while
  preserving separate role labels.
- **FR-011**: System MUST provide admin-managed role templates with limited capability toggles
  for `admin` and `instructor/coach` roles in MVP.
- **FR-012**: System MUST enforce globally unique organization slugs for tenant routing.

### Key Entities *(include if feature involves data)*

- **Organization**: Tenant/account container with owner, dedicated URL slug, and settings.
- **UserMembership**: Join model assigning user to organization with role and status.
- **Invite**: Pending staff invitation with role, inviter, organization, and acceptance state.
- **GuardianProfile**: Parent/guardian account context within organization.
- **ChildProfile**: Child record containing first name and birthday.
- **Activity**: Class/team/program offering with schedule/capacity constraints.
- **EnrollmentPolicy**: Rules for per-child signup limits.
- **Enrollment**: Child registration in an activity under policy validation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of organization creation attempts by valid owners persist org + owner role
  in a single completed flow.
- **SC-002**: At least 95% of accepted staff invites result in correct role assignment with no
  elevated access beyond role policy.
- **SC-003**: At least 90% of guardians complete account + first child creation in under
  5 minutes using org URL onboarding.
- **SC-004**: Enrollment limit enforcement blocks invalid enrollments with 0 policy bypasses in
  integration tests.

## Assumptions

- Instructors and coaches intentionally share the same access permissions for MVP.
- Billing/payments and advanced analytics are out of scope for this specification.
- Organization owners/admins configure offerings and limits before guardians enroll.
- Security/privacy hardening beyond child first name + birthday minimization may be expanded in
  later phases.
