# Feature Specification: Kids Activities Class Management Platform

**Feature Branch**: `001-kids-activities-platform`  
**Created**: 2026-03-30  
**Status**: Draft  
**Input**: User description: "Class management system for kids activities (dance, sports with field scheduling, etc.); one-stop multi-tenant platform; role-based views; org owners invite admins/instructors/coaches with admin-defined permissions; instructor vs coach same access, label differs; dedicated org sign-in URL for parent/guardian registration; children minimal PII (first name, birthday); configurable enrollment limits per org (e.g. one team vs many classes); future enhancements deferred."

## Clarifications

### Session 2026-03-30

- Q: Sign-in for v1 (previous options A vs B)? → A: Both email+password and magic link (passwordless email); staff and parents may use either method for the same account where product flow allows linking both to one identity.
- Q: Facility double-booking when times overlap? → A: Hard block—save rejected until staff changes time, facility, or the conflicting booking; clear error identifies the conflict.
- Q: Parent enrolls when activity is at capacity? → A: Simple **FIFO waitlist** per activity—parent joins queue; when a seat opens, next in line is notified (email and/or in-app); they have **48 hours** to complete enrollment or the offer expires and the queue advances to the next entry.
- Q: Same email across multiple orgs or roles? → A: **Single user identity per verified email**; **separate membership** per organization (staff role and/or parent/guardian in that org). Org entry URL sets active org context; an org switcher or re-entry via another org’s URL is required when the user belongs to multiple orgs.
- Q: Child age vs activity eligibility? → A: **Optional per-activity inclusive min/max age** (whole years); enforced from child birthday. Age is measured as of the **first scheduled session start** for the activity; if no sessions exist yet, use **enrollment attempt date**. No bounds configured means no automatic age gate.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Organization, roles, and staff access (Priority: P1)

An organization owner creates a new organization for their youth program. The system provides a
dedicated URL (or path) that identifies that organization for sign-in and registration. The
owner invites other users as admins, instructors, or coaches. Instructors and coaches receive
the same permission capabilities; the role label differs for display only. Admins define which
actions instructors and coaches may perform (permission templates or equivalent). Staff members authenticate with the same two options (email+password and magic link) and only
see screens and actions allowed for their role and granted permissions.

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
scheduling behave correctly using test parent accounts or fixtures—without requiring payment.

**Acceptance Scenarios**:

1. **Given** an organization with admin access, **When** staff create an activity with schedule
   and capacity, **Then** the activity appears in staff management views and can be toggled to
   a published state that makes it parent-visible per rules below.
2. **Given** published activities, **When** an admin sets org enrollment policy to “single
   active enrollment per child” vs “multiple allowed,” **Then** parent attempts to exceed the
   policy are blocked with a clear explanation.
3. **Given** activities that require field time, **When** staff assign a facility and time
   window that overlaps an existing booking for that facility, **Then** the system rejects the
   save with a clear conflict message until time, facility, or the other booking is adjusted.
4. **Given** staff set optional inclusive ages 6–10 for an activity with a first session on a
   known date, **When** the activity is published, **Then** parent catalog and enrollment checks
   use age computed from child birthday relative to that first session (or enrollment date if no
   sessions).

---

### User Story 3 - Parent/guardian registration and child enrollment (Priority: P3)

A parent or guardian uses the organization’s dedicated URL to create their account or sign in
using email and password or a magic link (both MUST be offered for v1 for this persona).
They add a child profile containing only first name and birthday (security-first minimal PII).
They see only activities that are published and available to them. They enroll a child in an
activity within organization limits, or join a FIFO waitlist when the activity is full (see
acceptance scenarios). They cannot access staff-only data or other organizations’
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
3. **Given** a parent authenticated with **active org context A**, **When** they attempt to
   access org B parent or staff data without switching context, **Then** access is denied.
4. **Given** a parent with no password yet, **When** they complete magic-link sign-in, **Then**
   they can access the parent portal; **Given** they later set a password, **When** they sign in
   with email and password, **Then** they reach the same account.
5. **Given** a published activity at capacity, **When** the parent attempts enrollment for an
   eligible child, **Then** they can join the waitlist and see their queued state; **Given** a
   seat opens and they are first in queue, **When** they receive notification, **Then** they can
   complete enrollment within 48 hours or the offer expires and the next queue entry is served.
6. **Given** one verified email with parent memberships in org A and org B, **When** the user
   signs in via org A’s entry URL, **Then** they see only org A’s children and catalog; **When**
   they move to org B via org B’s URL or an in-app org switcher, **Then** they see only org B’s
   data.
7. **Given** a published activity with optional age bounds excluding the child’s age at the
   reference date, **When** the parent attempts enrollment or waitlist, **Then** the action is
   blocked with a clear explanation; when bounds include the child’s age, **Then** enrollment or
   waitlist proceeds subject to other rules.

---

### Edge Cases

- Parent tries to enroll when capacity is full—FIFO waitlist; 48-hour offer window then advance
  queue; duplicate waitlist entries for same child/activity prevented.
- Child age vs activity bounds—enrollment and waitlist use the same inclusive min/max rule;
  activities without bounds skip automatic age checks.
- Same email invited to multiple orgs—invites merge into one identity; each accept adds a
  membership; duplicate same-org role invites handled idempotently or surfaced for admin.
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
- **FR-005**: System MUST enforce role-based access: every authenticated request runs in an
  **active organization context** (from the org entry URL or a documented org-switcher). Users
  only access views and actions permitted by the **membership** for that organization (role and
  admin-granted permissions for staff; parent capabilities for guardian memberships). The system
  MUST maintain **one user identity per verified email**; a person MAY have **multiple
  memberships** across organizations (e.g. parent in org A, coach in org B). Invites MUST resolve to
  the existing identity when the email matches verified credentials. The system MUST NOT require
  separate unrelated login accounts for the same email solely because orgs differ. Child
  profiles and enrollments remain **scoped per organization** to the guardian’s membership in
  that org.
- **FR-006**: System MUST allow admins (and permitted staff) to define activities catalog
  items suitable for kids programs (classes, teams, sessions), including publication state and
  optional **inclusive minimum/maximum ages** in whole years. When set, eligibility MUST be
  computed from the child’s stored birthday relative to the **first scheduled session start** for
  that activity; if no session is scheduled, use **the enrollment or waitlist attempt date**. If
  no age bounds are set, the system MUST NOT automatically block by age.
- **FR-007**: System MUST allow organization-level enrollment policy defining whether a child
  may hold one active enrollment or multiple, interpreted consistently across enrollment actions.
- **FR-008**: System MUST support associating scheduled activity instances with facilities or
  fields to record utilization (at minimum: which resource, when), aligned with sports use cases.
  For a given organization, overlapping use of the same facility MUST be **hard-blocked** at save
  time with an explicit error; silent overlap or warn-only overlap is not allowed in v1.
- **FR-009**: Parent/guardian accounts MUST be able to register or sign in via the organization
  entry point and MUST be able to manage child profiles containing at most first name and
  birthday for children unless future specs expand fields.
- **FR-010**: System MUST reject attempts to collect or store non-approved child PII fields at
  the application layer for this scope.
- **FR-011**: Parents MUST see only published activities eligible for their org and MUST enroll
  children subject to capacity, enrollment policy, and **FR-006** age rules when configured
  (including clear UX when a child is out of range).
- **FR-012**: When an activity is at capacity, parents MUST be able to add an eligible child to a
  **first-in-first-out waitlist** scoped to that activity within the organization. When capacity
  increases or an enrolled child leaves, the system MUST notify the next waitlisted guardian
  (email and/or in-app) and MUST allow **48 hours** to complete enrollment before the offer
  expires and the next waitlisted entry is notified. Staff MUST be able to view and manage
  waitlist order for operational support. Advanced prioritization (paid skip, sibling priority,
  skill-based ordering) is out of scope for v1. Joining a waitlist MUST apply the same **FR-006**
  age eligibility checks as direct enrollment.
- **FR-013**: System MUST authenticate staff and parents using **both** (1) email + password and
  (2) magic link (passwordless email sign-in) for v1. A single user identity MUST support either
  method once verified (e.g. user can set password after magic-link first login or request magic
  link when password forgotten). SSO and social OAuth remain out of scope for v1 unless added by a
  later spec.
- **FR-014**: System MUST log security-relevant staff actions at a level appropriate for audit
  (detail to be determined in planning) without logging unnecessary child PII.

### Key Entities *(include if feature involves data)*

- **User identity**: One per verified email; authentication factors (password, magic link);
  aggregates **memberships** across orgs.
- **Organization**: Tenant boundary; branding/name; dedicated entry identifier; enrollment
  policies; subscription/billing out of scope unless later specified.
- **Membership**: Links a **user identity** to one organization; staff role(s) (owner, admin,
  instructor, coach) with effective permission set; may include parent/guardian eligibility for
  that org; children and enrollments for guardians are scoped through the org’s membership.
- **Permission / capability assignment**: Admin-controlled mapping of which actions each
  instructor/coach (or group) may perform.
- **Invitation**: Pending staff join to an org with intended role and label; optional expiry.
- **Activity / program**: Offered class or team; metadata for parents vs staff; publication
  state; capacity rules; optional inclusive **min/max age** (whole years) per **FR-006**.
- **Session / occurrence**: Scheduled instance; optional link to facility or field for resource
  utilization.
- **Facility / resource**: Bookable location (field, studio, court); bookings enforce
  non-overlapping reservations per facility within the organization (hard block on conflict).
- **Child profile**: Linked to parent account within an org context; fields limited to approved
  minimum for v1.
- **Enrollment**: Links child to activity (or session) subject to policy and capacity.
- **Waitlist entry**: Ordered queue per activity for a child; tracks position, offer state, and
  timestamps; one entry per child per activity.

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
- **SC-005**: Pilot or test suite covers full-capacity waitlist join, seat opening, notification
  to next in FIFO order, successful enrollment within 48 hours, and automatic advance when the
  offer expires.
- **SC-006**: Tests demonstrate age-gated activities: in-range child enrolls; out-of-range
  child is blocked for enrollment and waitlist with clear messaging; activities without bounds
  do not apply age checks.

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
- **Advanced** waitlist rules (paid priority, sibling priority, skill bands, automated
  rebalancing across activities), proration, uniforms, merchandise, and fundraising. **Simple
  FIFO waitlists** are in scope per FR-012.
- Automated referee/official scheduling beyond facility utilization for activities.

Implementation MUST follow `.specify/memory/constitution.md` when this spec drives engineering
work (clarity, performance vs readability balance, comments for complexity, reusable structure).
