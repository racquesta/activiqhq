# Tasks: Kids Activities Class Management Platform

**Input**: Design documents from `/specs/001-kids-activities-platform/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/README.md`

**Tests**: Include integration/contract tests for each story because success criteria are measurable and policy-sensitive.  
**Organization**: Tasks are grouped by user story and split into small, reviewable chunks.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependency)
- **[Story]**: `US1`, `US2`, `US3`, or `Shared`
- Every task includes explicit file paths.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ensure local tooling, visual tokens, and baseline project wiring are ready.

- [X] T001 [Shared] Add/confirm npm scripts for Supabase local workflow in `package.json`
- [X] T002 [Shared] Add/verify local env template in `.env.local.example`
- [X] T003 [P] [Shared] Add typography/color/design tokens to `app/globals.css`
- [X] T004 [P] [Shared] Add brand asset usage component(s) in `components/brand/`
- [X] T005 [Shared] Align base app shell and metadata in `app/layout.tsx`

**Checkpoint**: Local app boots with brand token baseline and env guidance.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core tenancy, auth, RBAC, API scaffolding, and schema baseline used by all stories.

**⚠️ CRITICAL**: No user story work starts before this phase is complete.

- [X] T006 [Shared] Create/refresh core Supabase schema migration in `supabase/migrations/*_core_tables.sql`
- [X] T006a [Shared] Create github action to ensure database migrations are synced prior to vercel deployment
- [X] T006b [Shared] Tracking: Set github env vars with supabase env vars
- [X] T006c [Shared] Tracking: Update vercel to enable deployment checks
- [X] T007 [Shared] Add role template + org policy tables in `supabase/migrations/*_rbac_policy.sql`
- [X] T008 [Shared] Add RLS policies and tenant isolation rules in `supabase/migrations/*_rls.sql`
- [X] T009 [P] [Shared] Implement Supabase server/client helpers in `lib/supabase/`
- [X] T010 [P] [Shared] Implement authenticated user guard in `lib/auth/require-user.ts`
- [X] T011 [Shared] Implement org-slug tenant resolver middleware in `middleware.ts`
- [X] T012 [Shared] Implement reusable org context loader in `lib/auth/org-context.ts`
- [X] T013 [Shared] Add shared validation schemas for org/member/child/enrollment payloads in `lib/validations/`
- [X] T014 [Shared] Add API route scaffolding for `/api/organizations` and `/api/o/[orgSlug]/*` in `app/api/`
- [X] T015 [Shared] Add base error response helpers in `lib/api/errors.ts`

**Checkpoint**: Foundation ready; user stories can proceed independently.

---

## Phase 3: User Story 1 - Organization setup and staff management (Priority: P1) 🎯 MVP

**Goal**: Owners can create organizations; owner/admin can invite staff; role templates support limited capability toggles.

**Independent Test**: Create org, invite staff, accept invite, verify role template-based access.

### Tests for User Story 1

- [X] T016 [P] [US1] Add API contract tests for org creation/invites in `tests/contract/us1-org-staff.test.ts`
- [X] T017 [P] [US1] Add integration test for role template toggle behavior in `tests/integration/us1-role-templates.test.ts`

### Implementation for User Story 1

- [X] T018 [US1] Implement `POST /api/organizations` in `app/api/organizations/route.ts`
- [X] T019 [US1] Implement role template read/update API in `app/api/o/[orgSlug]/role-templates/`
- [X] T020 [US1] Implement staff invite API in `app/api/o/[orgSlug]/invites/route.ts`
- [X] T021 [US1] Implement invite acceptance flow in `app/o/[orgSlug]/invite/[token]/page.tsx`
- [X] T022 [US1] Build org setup screen in `app/organizations/new/page.tsx`
- [X] T023 [US1] Build staff management UI in `app/o/[orgSlug]/settings/staff/page.tsx`
- [X] T024 [US1] Build role template editor UI in `components/org/role-template-editor.tsx`
- [X] T025 [US1] Add authorization checks for management routes in `lib/auth/permissions.ts`

**Checkpoint**: US1 fully functional and independently testable.

---

## Phase 4: User Story 2 - Guardian and child registration via org URL (Priority: P1)

**Goal**: Guardians can join organizations through slug URL and create child profiles with duplicate-warning confirmation.

**Independent Test**: Guardian joins `/o/{orgSlug}`, creates child; duplicate triggers confirmation and succeeds only when confirmed.

### Tests for User Story 2

- [ ] T026 [P] [US2] Add API contract tests for guardian join + child creation in `tests/contract/us2-guardian-child.test.ts`
- [ ] T027 [P] [US2] Add integration test for duplicate child warning flow in `tests/integration/us2-duplicate-child.test.ts`

### Implementation for User Story 2

- [ ] T028 [US2] Implement guardian org join API in `app/api/o/[orgSlug]/guardians/join/route.ts`
- [ ] T029 [US2] Implement child creation API with duplicate detection in `app/api/o/[orgSlug]/children/route.ts`
- [ ] T030 [US2] Implement guardian onboarding page in `app/o/[orgSlug]/join/page.tsx`
- [ ] T031 [US2] Implement child add form and duplicate confirmation modal in `components/guardian/child-form.tsx`
- [ ] T032 [US2] Implement guardian dashboard shell in `app/o/[orgSlug]/guardian/page.tsx`
- [ ] T033 [US2] Add org-context enforcement for multi-org guardian users in `lib/auth/org-context.ts`

**Checkpoint**: US2 fully functional and independently testable.

---

## Phase 5: User Story 3 - Activity discovery and enrollment rules (Priority: P2)

**Goal**: Guardians can view eligible activities and enroll children while org-wide per-child limits are enforced.

**Independent Test**: Admin sets limit; guardian enrolls child up to limit; extra enrollment blocked with policy error.

### Tests for User Story 3

- [X] T034 [P] [US3] Add API contract tests for enrollment policy + enrollments in `tests/contract/us3-enrollment-policy.test.ts`
- [X] T035 [P] [US3] Add integration test for limit enforcement in `tests/integration/us3-enrollment-limit.test.ts`

### Implementation for User Story 3

- [ ] T036 [US3] Implement enrollment policy get/update API in `app/api/o/[orgSlug]/enrollment-policy/route.ts`
- [ ] T037 [US3] Implement activity listing API with eligibility filter in `app/api/o/[orgSlug]/activities/route.ts`
- [ ] T038 [US3] Implement enrollment create API with limit enforcement in `app/api/o/[orgSlug]/enrollments/route.ts`
- [ ] T039 [US3] Build enrollment policy settings UI in `app/o/[orgSlug]/settings/enrollment/page.tsx`
- [ ] T040 [US3] Build guardian activities browse/enroll UI in `app/o/[orgSlug]/activities/page.tsx`
- [ ] T041 [US3] Add reusable enrollment limit policy service in `lib/org/enrollment-policy.ts`

**Checkpoint**: US3 functional with policy enforcement and independent verification.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: Final UX alignment, quality gates, and docs.

- [ ] T042 [P] [Shared] Apply visual identity refinements to marketing hero and cards in `app/page.tsx` and `components/brand/`
- [ ] T043 [Shared] Add accessibility pass for forms/buttons/headings in `app/` and `components/`
- [ ] T044 [Shared] Add i18n message keys for new surfaces in `messages/en.json`
- [ ] T045 [Shared] Run full migration reset and sanity-check local setup docs in `specs/001-kids-activities-platform/quickstart.md`
- [ ] T046 [Shared] Run lint/type/tests and document outcomes in `specs/001-kids-activities-platform/plan.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): start immediately.
- Foundational (Phase 2): blocks all user stories.
- US1/US2/US3: begin after Phase 2; US1 and US2 are highest priority.
- Polish: after target stories are complete.

### User Story Dependencies

- **US1**: no dependency on other stories after foundation.
- **US2**: depends on tenant routing/auth foundation; independent of US1 implementation details.
- **US3**: depends on child profiles and activities/policy primitives; can proceed once Phase 2 + minimal US2 child flow exist.

### Parallel Opportunities

- T003/T004 and T009/T010 can run in parallel.
- Contract and integration tests within each story can run in parallel.
- UI and API tasks within a story can be parallelized after shared schemas/services exist.

---

## Implementation Strategy

### MVP First

1. Complete Phases 1-2.
2. Deliver US1 (organization + staff).
3. Deliver US2 (guardian + child onboarding).
4. Validate MVP against SC-001/SC-002/SC-003.

### Incremental Delivery

1. Ship US1.
2. Ship US2.
3. Ship US3 with enrollment limit enforcement.
4. Finish polish and quality checks.
