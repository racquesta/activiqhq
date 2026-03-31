# Feature Specification: Kids Activities Class Management Platform

**Feature Branch**: `001-kids-activities-platform`  
**Created**: 2026-03-30  
**Status**: Draft  
**Input**: User description: "Class management system for kids activities (dance, sports with field scheduling, etc.); one-stop multi-tenant platform; role-based views; org owners invite admins/instructors/coaches with admin-defined permissions; instructor vs coach same access, label differs; dedicated org sign-in URL for parent/guardian registration; children minimal PII (first name, birthday); configurable enrollment limits per org (e.g. one team vs many classes); future enhancements deferred."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Organization, roles, and staff access (Priority: P1)

An organization owner creates a new organization for their youth program. The system provides a
dedicated URL (or path) that identifies that organization for sign-in and registration. The
owner invites other users as admins, instructors, or coaches. Instructors and coaches receive
the same permission capabilities; the role label differs for display only. Admins define which
actions instructors and coaches may perform (permission templates or equivalent). Staff members
authenticate and only see screens and actions allowed for their role and granted permissions.

**Why this priority**: Multi-tenant structure and access control are prerequisites for every
other journey. Without org isolation and staff roles, programs cannot operate safely at scale.

**Independent Test**: Using only staff accounts, create an organization, assign roles, adjust
admin-granted permissions for an instructor vs coach, and verify each role’s UI and allowed
actions match policy without any parent or child data present.

**Acceptance Scenarios**:

1. **Given** a new user eligible to create an organization, **When** they create an org with
   required org details, **Then** the org exists, they are the owner, and a dedicated
   organization entry/sign-in URL is available for sharing.
2. **Given** an admin with invite rights, **When** they invite a user as instructor or coach,
   **Then** the invitee can onboard with equivalent capabilities (subject to admin-configured
   permission differences if admins choose to vary them by assignment), and labels show
   “Instructor” vs “Coach” as selected.
3. **Given** an admin, **When** they change which actions instructors/coaches may perform,
   **Then** affected users gain or lose access to those actions on next session (or within a
   documented freshness window).

---

### User Story 2 - Activities, enrollment policy, and facility scheduling (Priority: P2)

Administrators (and permitted staff) define activities parents can enroll in: for example
dance classes or team sports. For sports and similar use cases, staff can associate activities
or sessions with facilities or fields to represent utilization scheduling. Organization policy
defines how many concurrent enrollments a single parent account may hold (for example exactly
one team enrollment vs multiple class enrollments). The catalog and rules are visible only in
appropriate staff views; publication state controls what parents can see.

**Why this priority**: Parents need a governed catalog and limits before enrollment is
meaningful; field utilization is a core differentiator for sports programs.

**Independent Test**: With Story 1 satisfied, staff create activities, set enrollment limit
policy, attach optional facility reservations to scheduled sessions, and verify limits and
scheduling behave correctly using test parent accounts or fixtures—without requiring payment or
waitlists.

**Acceptance Scenarios**:

1. **Given** an organization with admin access, **When** staff create an activity with schedule
   and capacity, **Then** the activity appears in staff management views and can be toggled to
   a published state that makes it parent-visible per rules below.
2. **Given** published activities, **When** an admin sets org enrollment policy to “single
   active enrollment per child” vs “multiple allowed,” **Then** parent attempts to exceed the
   policy are blocked with a clear explanation.
3. **Given** activities that require field time, **When** staff assign a facility and time
   window to a session, **Then** double-booking the same facility for overlapping times is
   prevented or surfaced as a conflict for resolution [NEEDS CLARIFICATION: conflict policy—hard
   block vs warning only].

---

### User Story 3 - Parent/guardian registration and child enrollment (Priority: P3)

A parent or guardian uses the organization’s dedicated URL to create their account or sign in.
They add a child profile containing only first name and birthday (security-first minimal PII).
They see only activities that are published and available to them. They enroll a child in an
activity within organization limits. They cannot access staff-only data or other organizations’
catalogs.

**Why this priority**: Delivers end-user value after governance (P1) and catalog (P2) exist;
can be tested with seeded activities if Story 2 is stubbed, but full value requires Story 2.

**Independent Test**: End-to-end from org URL: new parent registers, adds one child with allowed
fields only, views published catalog, enrolls within cap, and receives confirmation; attempt to
store disallowed child fields fails validation.

**Acceptance Scenarios**:

1. **Given** a published activity with open capacity, **When** a parent adds a child with first
   name and valid birthday only, **Then** the child is saved and the parent can select that
   child for enrollment.
2. **Given** enrollment policy allows multiple classes, **When** the parent enrolls the same
   child in two non-conflicting activities, **Then** both enrollments succeed; when policy
   allows only one, the second enrollment is blocked.
3. **Given** a parent authenticated under org A, **When** they attempt to access org B data or
   staff URLs, **Then** access is denied.

---

### Edge Cases

- Parent tries to enroll when capacity is full—waitlist vs hard deny [NEEDS CLARIFICATION].
- Child’s age or birth year vs activity age rules—system behavior [NEEDS CLARIFICATION: rules
  not specified].
- Same email invited to multiple roles or organizations—expected merge vs separate memberships
  [NEEDS CLARIFICATION].
- Invitation expired, resent, or revoked mid-signup.
- Admin removes a staff member who created activities—ownership transfer [NEEDS CLARIFICATION].
- Org slug or URL uniqueness collision on create—clear error and retry guidance.
- Concurrent edits to permission templates by two admins—last-write vs optimistic locking
  [NEEDS CLARIFICATION].

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support multiple isolated organizations (tenants); data for one org
  MUST NOT be exposed to users of another except where a future cross-org feature explicitly
  defines it (out of scope for this spec).
- **FR-002**: System MUST support organization creation by an authorized user and MUST provide
  a dedicated organization-specific entry point (URL or path) for authentication and parent
  registration.
- **FR-003**: System MUST support roles: organization owner, admin, instructor, and coach;
  instructor and coach MUST share the same technical permission model; labels MUST differ for
  display per assignment.
- **FR-004**: Admins MUST be able to invite users to staff roles and MUST be able to configure
  which actions instructors and coaches may perform (granularity to be determined in planning).
- **FR-005**: System MUST enforce role-based access: each authenticated user only accesses views
  and actions permitted by their org membership, role, and admin-granted permissions.
- **FR-006**: System MUST allow admins (and permitted staff) to define activities catalog
  items suitable for kids programs (classes, teams, sessions), including publication state.
- **FR-007**: System MUST allow organization-level enrollment policy defining whether a child
  may hold one active enrollment or multiple, interpreted consistently across enrollment actions.
- **FR-008**: System MUST support associating scheduled activity instances with facilities or
  fields to record utilization (at minimum: which resource, when), aligned with sports use cases.
- **FR-009**: Parent/guardian accounts MUST be able to register or sign in via the organization
  entry point and MUST be able to manage child profiles containing at most first name and
  birthday for children unless future specs expand fields.
- **FR-010**: System MUST reject attempts to collect or store non-approved child PII fields at
  the application layer for this scope.
- **FR-011**: Parents MUST see only published activities eligible for their org and MUST enroll
  children subject to capacity and enrollment policy.
- **FR-012**: System MUST authenticate staff and parents; primary staff/parent authentication
  mechanism MUST be chosen in planning [NEEDS CLARIFICATION: e.g. email/password, magic link,
  SSO].
- **FR-013**: System MUST log security-relevant staff actions at a level appropriate for audit
  (detail to be determined in planning) without logging unnecessary child PII.

### Key Entities *(include if feature involves data)*

- **Organization**: Tenant boundary; branding/name; dedicated entry identifier; enrollment
  policies; subscription/billing out of scope unless later specified.
- **Membership**: Links a user to an organization with a role (owner, admin, instructor, coach)
  and effective permission set.
- **Permission / capability assignment**: Admin-controlled mapping of which actions each
  instructor/coach (or group) may perform.
- **Invitation**: Pending staff join to an org with intended role and label; optional expiry.
- **Activity / program**: Offered class or team; metadata for parents vs staff; publication
  state; capacity rules.
- **Session / occurrence**: Scheduled instance; optional link to facility or field for resource
  utilization.
- **Facility / resource**: Bookable location (field, studio, court) with availability rules
  [detail in planning].
- **Child profile**: Linked to parent account within an org context; fields limited to approved
  minimum for v1.
- **Enrollment**: Links child to activity (or session) subject to policy and capacity.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Organization owners and admins can complete org setup and first staff invitation
  in under 15 minutes in usability testing with guided tasks.
- **SC-002**: 100% of cross-tenant isolation checks pass in test suite (no parent or staff can
  read another org’s private data using normal UI/API paths).
- **SC-003**: At least 90% of parents in pilot complete child add and first enrollment on first
  attempt without support when activities are pre-published.
- **SC-004**: Staff can define at least two distinct enrollment-limit policies (single vs
  multiple) and verified scenarios demonstrate correct blocking and allowance.

## Assumptions

- Programs operate under one legal entity per organization; cross-org reporting is deferred.
- English-first UI is acceptable for v1; localization [NEEDS CLARIFICATION].
- Payments, refunds, and financial reporting are out of scope unless added in a later spec.
- “Enhanced features” mentioned by stakeholders (e.g. messaging, advanced reporting,
  integrations) are explicitly out of scope for this specification.
- Compliance with regional child-data regulations is required; exact jurisdictions and DPA needs
  to be confirmed during planning [NEEDS CLARIFICATION: target regions].

## Out of Scope (later phases)

- Deep analytics, marketing automation, and third-party integrations.
- Mobile native apps (responsive web may still be an implementation choice in planning).
- Advanced waitlists, proration, uniforms, merchandise, and fundraising.
- Automated referee/official scheduling beyond facility utilization for activities.

Implementation MUST follow `.specify/memory/constitution.md` when this spec drives engineering
work (clarity, performance vs readability balance, comments for complexity, reusable structure).
