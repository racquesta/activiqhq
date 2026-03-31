# Tasks: Kids Activities Class Management Platform

**Input**: Design documents from `/specs/001-kids-activities-platform/`  
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [data-model.md](./data-model.md), [contracts/README.md](./contracts/README.md), [research.md](./research.md), [quickstart.md](./quickstart.md)

**Tests**: **Required** per [spec.md](./spec.md) **FR-019** and **SC-010**: unit tests (domain logic) + user-flow E2E; see **Phase 7**.

**Organization**: Phases follow **US1 → US2 → US3** (P1–P3). Paths are repo-root absolute-style from project root `activiqhq/`.

## Format

`- [ ] [TaskID] [P?] [Story?] Description with file path`

---

## Phase 1: Setup (shared infrastructure)

**Purpose**: Dependencies, UI primitives, i18n scaffolding (FR-016), Supabase client skeleton.

- [ ] T001 Add runtime deps `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `next-intl` in `package.json` and run install
- [ ] T002 [P] Create browser Supabase client `lib/supabase/client.ts`
- [ ] T003 [P] Create server Supabase client + cookie adapter `lib/supabase/server.ts` (document SSR pattern per current Supabase Next docs in comments)
- [ ] T004 Create session refresh helper for middleware `lib/supabase/middleware.ts`
- [ ] T005 [P] Create shared action/Zod helpers and error code constants `lib/validations/actions.ts` (align with `contracts/README.md`)
- [ ] T006 [P] Create English message bundle `messages/en.json` and loader `lib/i18n/messages.ts` (FR-016; wire to `next-intl` in subsequent tasks)
- [ ] T007 [P] Add shadcn-free UI primitives per ActiviqHQ plan: `components/ui/button.tsx`, `components/ui/card.tsx`, `components/ui/input.tsx`, `components/ui/label.tsx`
- [ ] T008 Extend `app/globals.css` `@theme` with brand activity colors and spacing scale from `specs/001-kids-activities-platform/plan.md`
- [ ] T009 Configure `next-intl` routing — add `i18n/routing.ts`, `i18n/request.ts`, and wrap root layout per Next 16 + next-intl docs (English default only)

---

## Phase 2: Foundational (blocking — before user stories)

**Purpose**: DB alignment (**FR-004**), RLS, middleware org context, auth helpers. No US screens until this passes. (**FR-018** residency is **Phase 8**.)

**⚠️ CRITICAL**: Complete Phase 2 (and **Phase 2b**) before **Phase 3–5**.

- [ ] T010 Add migration `supabase/migrations/20260331100000_org_membership_permissions_version.sql`: `org_memberships.permissions_version int` + `org_memberships.updated_at` for optimistic concurrency (FR-004). **No** `data_residency` on `organizations` until **T069** (**FR-018**).
- [ ] T011 Add migration `supabase/migrations/20260331110000_rls_policies.sql`: tenant-scoped RLS per `data-model.md` (comment each policy); service-role bypass documented
- [ ] T012 Add auth sync migration or SQL: `public.profiles` insert trigger from `auth.users` (or equivalent documented pattern) in `supabase/migrations/20260331120000_profiles_trigger.sql`
- [ ] T013 Create root `middleware.ts` combining Supabase session refresh + pass `x-pathname` / org slug extraction for `/o/[slug]` routes (extend in **T019** for `/organizations/new`)
- [ ] T014 Create `lib/auth/require-user.ts` (`requireSession`, `requireProfile`)
- [ ] T015 Create `lib/auth/org-context.ts`: `getOrganizationBySlug`, `requireOrgMembership`, staff vs parent checks (FR-005)
- [ ] T016 **MVP**: Confirm all server paths use **`lib/supabase/server.ts`** (single project); add a short comment in `server.ts` pointing to **Phase 8 / FR-018** for future dual-project routing (**defer** `server-for-org.ts` to **T069**)
- [ ] T017 Ensure `.env.local.example` and `quickstart.md` describe **single** `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` for MVP; add a **Post-MVP** note referencing **FR-018** for optional EU env vars

**Checkpoint**: Local `supabase db reset` applies all migrations; middleware runs; a test user can authenticate.

---

## Phase 2b: Organization bootstrap (FR-002)

**Purpose**: First-time **org creation** cannot live only under `/o/[slug]` (slug does not exist yet). These tasks run **after** Phase 2 migrations, **with** Phase 3 server actions.

- [ ] T018 [US1] Add `app/(onboarding)/organizations/new/page.tsx` (and thin layout if needed): form calls `createOrganization` in `app/actions/organization.ts`, then `redirect` to `/o/[slug]/staff` (FR-002 dedicated entry after creation; creator becomes **sole owner**, FR-003)
- [ ] T019 [US1] Update `middleware.ts` + `app/page.tsx`: **`/`** is **marketing or minimal static** landing—**no** auto-redirect into `/o/[slug]` for signed-in users (Clarifications, FR-002); authenticated users **without** org membership **may** access `/organizations/new`; all `/o/[slug]/*` still require valid org membership (FR-005)

---

## Phase 3: User Story 1 — Organization, roles, staff (P1)

**Goal**: Org creation, slug URL, invitations, staff roles, permission edits with optimistic concurrency, membership revoke (FR-015).

**Independent test**: Staff-only path: **bootstrap** org via `/organizations/new`, invite instructor/coach, accept invite, edit permissions with version token, revoke member; revoked user blocked; catalog rows remain (FR-015).

### Implementation

- [ ] T020 [US1] Add staff route group layout `app/(dashboard)/o/[slug]/layout.tsx` (max-width 1200px shell, role slot)
- [ ] T021 [US1] Add staff dashboard home `app/(dashboard)/o/[slug]/staff/page.tsx` (placeholder metrics)
- [ ] T022 [US1] Server actions `app/actions/organization.ts`: `createOrganization` (no residency field in MVP), `updateOrganizationEnrollmentPolicy` — **must** be callable from **T018** before slug routes exist
- [ ] T023 [US1] Server actions `app/actions/invitations.ts`: `inviteStaff`, `revokeInvitation`, `acceptInvitation` (token, FR-005 single identity); **`inviteStaff` MUST accept only `admin` \| `instructor` \| `coach`**—**reject** `owner` / co-owner (FR-003, `contracts/README.md`)
- [ ] T024 [US1] Server actions `app/actions/membership.ts`: `updateMemberPermissions` (optimistic `permissions_version`, FR-004), `revokeStaffMembership` (FR-015)
- [ ] T025 [US1] UI `app/(dashboard)/o/[slug]/staff/settings/organization-form.tsx` — **edit enrollment policy only** for existing org (uses `updateOrganizationEnrollmentPolicy`; not first-time create)
- [ ] T026 [US1] UI `app/(dashboard)/o/[slug]/staff/team/invite-form.tsx` + `team/member-list.tsx` (roles **admin**, instructor, coach + labels; **no** owner invite—FR-003)
- [ ] T027 [US1] UI `app/(dashboard)/o/[slug]/staff/team/permissions-editor.tsx` — passes version token, handles stale error (contracts)
- [ ] T028 [US1] Public invite accept page `app/(auth)/invite/[token]/page.tsx` flow (magic link + password paths FR-013)
- [ ] T029 [US1] Write staff mutations to `audit_logs` via small helper `lib/audit/staff-action.ts` (FR-014, no child PII)

**Checkpoint**: US1 acceptance scenarios **1–6** from `spec.md` manually verifiable (incl. reject owner invite).

---

## Phase 4: User Story 2 — Activities, enrollment policy, facilities (P2)

**Goal**: Activities with age bounds, sessions, facilities, bookings, hard-block overlap (FR-008), publish flag, org enrollment policy UI already partial from US1.

**Independent test**: Staff creates activity + session + facility booking; overlapping booking rejected; policy single vs multiple enforced at enrollment time (with US3).

### Implementation

- [ ] T030 [US2] Server actions `app/actions/activities.ts`: `createActivity`, `updateActivity`, `publishActivity`, age fields FR-006
- [ ] T031 [US2] Server actions `app/actions/sessions.ts`: `createActivitySession` (organization_id denormalized)
- [ ] T032 [US2] Server actions `app/actions/facilities.ts`: `createFacility`, `bookFacilityForSession` with transactional overlap check `lib/domain/facility-booking.ts` (**FR-008**: **half-open** `[start, end)` or equivalent; **positive-duration overlap** hard-blocked; **endpoint-adjacent** allowed)
- [ ] T033 [US2] Shared pure helper `lib/domain/age-eligibility.ts` — reference date rules FR-006 (comment edge cases)
- [ ] T034 [US2] Staff UI `app/(dashboard)/o/[slug]/staff/activities/page.tsx` + `activities/activity-form.tsx` + `activities/activity-list.tsx`
- [ ] T035 [US2] Staff UI `app/(dashboard)/o/[slug]/staff/activities/[activityId]/sessions/page.tsx` + session form
- [ ] T036 [US2] Staff UI `app/(dashboard)/o/[slug]/staff/facilities/page.tsx` + booking UI tied to sessions
- [ ] T037 [US2] Optional calendar/chip display `components/schedule/activity-chip.tsx` using brand activity colors (plan Visual Identity)

**Checkpoint**: US2 acceptance scenarios **1–5** from `spec.md` (incl. adjacent booking allowed).

---

## Phase 5: User Story 3 — Parent/guardian registration & enrollment (P3)

**Goal**: Parent org URL auth, child CRUD (minimal PII), catalog published-only, enroll + waitlist FIFO 48h (FR-012), multi-org context (FR-005), age + capacity + policy gates.

**Independent test**: Parent journey on `/o/[slug]/...` without staff leaks; cross-org denied; waitlist FIFO + **email** offer (**T048**) + 48h advance; deletion blocked with active enrollment (**T050**, US3 scenario 8).

### Implementation

- [ ] T038 [US3] Parent layout `app/(dashboard)/o/[slug]/parent/layout.tsx` + nav
- [ ] T039 [US3] Auth pages under `app/(auth)/o/[slug]/login/page.tsx`, `register/page.tsx` — password + magic link (FR-013) using Supabase Auth
- [ ] T040 [US3] Server actions `app/actions/children.ts`: `createChild`, `updateChild` (first_name, birth_date only FR-009/10)
- [ ] T041 [US3] Server actions `app/actions/enrollment.ts`: `requestEnrollment` (capacity, policy FR-007, age FR-006, AGE_INELIGIBLE / CAPACITY_FULL / ENROLLMENT_POLICY_BLOCK)
- [ ] T042 [US3] Server actions `app/actions/waitlist.ts`: `joinWaitlist`, `advanceWaitlistOnSeatOpen` (FIFO, FR-012), `completeOfferedEnrollment` (48h OFFER_EXPIRED)
- [ ] T043 [US3] Lib `lib/domain/waitlist.ts` — position assignment, offer expiry rules (comment FIFO)
- [ ] T044 [US3] Parent UI `app/(dashboard)/o/[slug]/parent/children/page.tsx` + child form
- [ ] T045 [US3] Parent UI `app/(dashboard)/o/[slug]/parent/activities/page.tsx` — published catalog only
- [ ] T046 [US3] Parent UI `app/(dashboard)/o/[slug]/parent/enroll/[activityId]/page.tsx` — enroll + waitlist CTA
- [ ] T047 [US3] Org switcher component `components/org-switcher.tsx` for users with multiple parent memberships (single project MVP; **FR-018** may add same-cohort-only rules for dual projects)
- [ ] T048 [US3] **Transactional email** for waitlist seat offer (**FR-012 MVP**, Clarifications): implement `lib/email/waitlist-offer.ts` + send path (e.g. **Resend**, **Postmark**, or SMTP via server route)—**email is required** for offers; in-app optional; document env keys in `.env.local.example`; log/handle failures

**Checkpoint**: US3 acceptance scenarios **1–8** from `spec.md` (incl. blocked delete when enrollments/offers active).

---

## Phase 6: Polish & cross-cutting

**Purpose**: FR-017 privacy flows, FR-018 deployment checklist (SC-009), constitution pass, reserved Stripe route.

- [ ] T049 Add route handler `app/api/account/export/route.ts` — guardian JSON export (FR-017) authorized by session
- [ ] T050 Add server action `app/actions/privacy.ts`: `requestAccountDeletion` (FR-017) with documented retention exceptions UX; **block** with code `DELETION_BLOCKED_ACTIVE_ENROLLMENT` when active enrollments or open waitlist offers (Clarifications, `contracts/README.md`)
- [ ] T051 Add `app/(dashboard)/settings/privacy/page.tsx` — links to policy placeholders + export/delete controls
- [ ] T052 [P] Add footer/privacy links on `app/(auth)/layout.tsx` and parent layout (FR-017 transparency hooks)
- [ ] T053 Add stub `app/api/webhooks/stripe/route.ts` returning `501` (contracts)
- [ ] T054 Verify `specs/001-kids-activities-platform/plan.md` **MVP** environment matrix + single-client subsection stay accurate after implementation (**SC-009** US-primary)
- [ ] T055 Run `specs/001-kids-activities-platform/quickstart.md` end-to-end on clean machine; fix gaps in READMEs (`supabase/README.md`, root `README.md` if needed)
- [ ] T056 Constitution pass: comment RLS, org context, waitlist, age, facility overlap hot paths per `.specify/memory/constitution.md`

---

## Phase 7: Automated testing (FR-019, SC-010)

**Purpose**: **Unit tests** for pure/domain logic; **Playwright** user-flow tests for **P1–P3** (including **US2** catalog/facility). Wire **unit** suite into CI.

- [ ] T057 Add devDependencies and test scripts: `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@playwright/test` in `package.json` (`test`, `test:unit`, `test:e2e`)
- [ ] T058 Add `vitest.config.ts` at repo root and `tests/setup.ts` (React Testing Library cleanup if needed)
- [ ] T059 [P] [US2] Unit tests `lib/domain/age-eligibility.test.ts` covering FR-006 reference-date rules and no-bounds case
- [ ] T060 [P] [US2] Unit tests `lib/domain/facility-booking.test.ts` covering FR-008 overlap hard-block **and** endpoint-adjacent **allowed** cases (half-open semantics)
- [ ] T061 [P] [US3] Unit tests `lib/domain/waitlist.test.ts` covering FR-012 FIFO position and 48h offer advance semantics
- [ ] T062 [P] [US1] Unit tests `lib/domain/permissions-version.test.ts` (or `lib/auth/permissions-merge.test.ts`) — stale `permissions_version` / `updated_at` rejects update, success increments (FR-004)
- [ ] T063 Add `playwright.config.ts` with `baseURL` `http://127.0.0.1:3000` and documented `webServer` `npm run dev`
- [ ] T064 [US1] E2E `e2e/staff-org-invite.spec.ts` — bootstrap org via `/organizations/new` (or seed), invite flow, accept invite, open staff shell
- [ ] T065 [US3] E2E `e2e/parent-enroll.spec.ts` — org URL login/register, add child, view catalog, enroll or join waitlist (seed published activity)
- [ ] T066 [US1] E2E `e2e/cross-tenant-denial.spec.ts` — authenticated user cannot load another org’s `/o/[slug]` data (SC-002 smoke)
- [ ] T067 [US2] E2E `e2e/staff-activity-facility.spec.ts` — publish activity, add session + facility booking; assert **overlapping** second booking surfaces hard error **and** **back-to-back** (end=start) booking **succeeds** (FR-008, US2 scenario 4–5)
- [ ] T068 Add `.github/workflows/ci.yml` running `npm run test` (unit) on push/PR; document optional job or manual run for `test:e2e` with Supabase in `specs/001-kids-activities-platform/quickstart.md`

---

## Phase 8: Post-MVP — EEA, GDPR packaging & split residency (**FR-018**)

**Purpose**: **Not part of MVP.** Execute when product targets **EEA** and **dual** (EU/US) primary stores.

- [ ] T069 Add `organizations.data_residency` (`eu`|`us`) + migration; `createOrganization` sets cohort; optional `DEPLOYMENT_RESIDENCY_COHORT` for single-app bootstrapping—document
- [ ] T070 Implement `lib/supabase/server-for-org.ts` (and browser counterpart if needed): resolve org slug → `data_residency` → correct Supabase URL/anon pair; document JWT/session **must** match issuing project
- [ ] T071 Production env matrix: second Supabase project (EU), Vercel wiring (one or two apps), `quickstart.md` table for dual keys
- [ ] T072 Extend **FR-017** surfaces for EEA: legal/consent copy hooks, **processor DPA** availability for EU orgs (commercial artifact + in-app links as spec’d)
- [ ] T073 **SC-009** full checklist: EEA orgs → EU-primary, US orgs → US-primary; no misrouted cohorts
- [ ] T074 Revisit org switcher / identity rules (**FR-005** vs **FR-018**): e.g. one cohort per account default for dual projects

---

## Dependencies & execution order

| Phase | Depends on | Notes |
|-------|------------|--------|
| Phase 1 | — | Tooling |
| Phase 2 | Phase 1 | Migrations + middleware + **T016** (single `server.ts`) |
| Phase 2b | Phase 2 + **T022** (`createOrganization` callable) | Bootstrap routes |
| Phase 3 (US1) | Phase 2b | Slug-scoped staff UI |
| Phase 4 (US2) | Phase 3 | Catalog |
| Phase 5 (US3) | Phase 4 | Parents |
| Phase 6 | Phase 5 | Privacy + ops |
| Phase 7 | Phase 5+ (domain modules exist) | Unit tests parallel with Phases 4–6; E2E after features land |
| Phase 8 | After MVP ships + EEA decision | **FR-018**; depends on Phase 2 schema patterns but **not** blocking MVP |

**MVP**: Complete through **Phase 3 checkpoint** for staff demo; **full product** requires Phases 4–5. **Phase 7** should reach **SC-010** before MVP release candidate. **Phase 8** is **post-MVP**.

---

## Parallel opportunities

- **Phase 1**: T002, T003, T005, T006, T007 in parallel
- **Phase 2**: T010, T011, T012 can be authored in parallel (separate migration files); apply order by timestamp
- **Phase 4**: T034, T035, T036 UI splits across developers once T030–T032 stable
- **Phase 6**: T049, T052, T053 in parallel
- **Phase 7**: T059, T060, T061, T062 in parallel

---

## Summary counts

| Metric | Value |
|--------|-------|
| **Total tasks** | **74** (Phases 1–7: **68**; Phase 8: **6**) |
| **US1** | T018–T019, T020–T029 (**12** incl. bootstrap) |
| **US2** | T030–T037 (**8**) |
| **US3** | T038–T048 (**11**) |
| **Setup + Foundation + Polish** | T001–T017, Phase 2b, T049–T056 (**27**) |
| **Testing (Phase 7)** | T057–T068 (**12**) |

**Suggested MVP scope**: Phase 1 + Phase 2 + Phase 2b + Phase 3 (**T001–T029**); add **T057–T062** as domain modules land; **ship checklist**: **T048** real offer email + **T050** deletion guard + **SC-010** before release candidate.

**Format validation**: All tasks use `- [ ]`, sequential `Tnnn`, `[P]` only where parallel-safe, `[USn]` on story-phase tasks, and explicit file paths in descriptions.

**Remediation note** (speckit.analyze): **W1** (T018–T019, T025 split), **G1** (T067), **G2** (T062). **MVP rescope**: **T016** / **Phase 8** (**T069–T074**) for **FR-018**. **speckit.tasks refresh** (2026-03-30): Clarifications—**FR-002** `/`, **FR-003** owner invites, **FR-008** half-open, **FR-012** email, **FR-017** delete block.

---

## Implementation strategy

### MVP first (staff demo)

1. Phase 1 → Phase 2 → Phase 2b → Phase 3 (**T001–T029**).
2. Stop and verify US1 scenarios **1–6** independently.

### Full product (parents + catalog)

3. Phase 4 → Phase 5; verify US2 **1–5**, US3 **1–8**.
4. Phase 6 (privacy, **SC-008**); Phase 7 (**FR-019**, **SC-010**) before release candidate.
5. Phase 8 only when targeting **EEA** (**FR-018**).

### Parallel team

After Phase 2 + 2b: one developer on US1 polish, another can start US2 only after US1 **createOrganization** + slug routes exist—or sequence US2 after Phase 3 checkpoint per dependency table above.
