# Data Model: Kids Activities Platform

Derived from [spec.md](./spec.md) and [plan.md](./plan.md). All **tenant-scoped** tables include
`organization_id uuid NOT NULL REFERENCES public.organizations(id)` unless noted.

## Conventions

- **IDs**: `uuid` primary keys default `gen_random_uuid()` (Postgres 13+).
- **Timestamps**: `created_at`, `updated_at` `timestamptz` where useful; consider trigger for
  `updated_at`.
- **Soft deletes**: optional `deleted_at` for activities/children—defer unless audit needs it.
- **RLS**: Enable on all `public` tenant tables; policies restrict rows by **membership in
  `organization_id`** tied to `auth.uid()`.

## Entity Relationship Overview

```text
auth.users
    └── profiles (1:1)
    └── org_memberships (N) ──► organizations (1)
            └── optional staff permission flags / JSON capability map

organizations
    ├── invitations (staff)
    ├── facilities
    ├── activities ──► activity_sessions ──► facility_bookings
    ├── children (per guardian link—see below)
    ├── enrollments
    └── waitlist_entries
```

## Tables

### `organizations`

| Column | Type | Notes |
|--------|------|--------|
| id | uuid | PK |
| slug | text | UNIQUE; used in entry URL path |
| name | text | Display |
| enrollment_policy | text | e.g. `single_active` \| `multiple` (spec FR-007) |
| created_at | timestamptz | |

### `profiles`

Links Supabase auth to app identity (FR-005 single email).

| Column | Type | Notes |
|--------|------|--------|
| id | uuid | PK, **FK → auth.users(id)** |
| display_name | text | optional |
| created_at | timestamptz | |

### `org_memberships`

One row per **user × org** context; user can be staff and/or parent in same org.

| Column | Type | Notes |
|--------|------|--------|
| id | uuid | PK |
| organization_id | uuid | FK |
| user_id | uuid | FK → profiles(id) |
| staff_role | text | nullable; `owner` \| `admin` \| `instructor` \| `coach` |
| staff_label | text | display: “Instructor” vs “Coach” |
| is_parent | boolean | default false; guardian capabilities |
| permissions | jsonb | nullable; admin-granted action keys (e.g. invite, publish, facilities) |
| created_at | timestamptz | |

**Constraints**: Unique `(organization_id, user_id)`; check: at least one of `staff_role` or
`is_parent` is set (or allow both).

### `invitations`

| Column | Type | Notes |
|--------|------|--------|
| id | uuid | PK |
| organization_id | uuid | FK |
| email | citext | invited address |
| intended_staff_role | text | |
| intended_staff_label | text | |
| token | text | UNIQUE; secure random |
| expires_at | timestamptz | nullable |
| accepted_at | timestamptz | nullable |
| created_at | timestamptz | |

### `facilities`

| Column | Type | Notes |
|--------|------|--------|
| id | uuid | PK |
| organization_id | uuid | FK |
| name | text | |
| created_at | timestamptz | |

### `activities`

| Column | Type | Notes |
|--------|------|--------|
| id | uuid | PK |
| organization_id | uuid | FK |
| name | text | |
| description | text | optional |
| activity_kind | text | optional taxonomy for UI color |
| capacity | int | nullable if uncapped |
| min_age | int | nullable (whole years, inclusive) |
| max_age | int | nullable |
| published | boolean | default false |
| created_at | timestamptz | |

### `activity_sessions`

| Column | Type | Notes |
|--------|------|--------|
| id | uuid | PK |
| activity_id | uuid | FK → activities |
| starts_at | timestamptz | |
| ends_at | timestamptz | |
| organization_id | uuid | denormalized for RLS ease (FK consistent with activity) |

### `facility_bookings`

Session occupies facility; **no overlap** per facility (spec FR-008).

| Column | Type | Notes |
|--------|------|--------|
| id | uuid | PK |
| organization_id | uuid | FK |
| facility_id | uuid | FK |
| activity_session_id | uuid | FK UNIQUE (one booking per session typical) |
| starts_at | timestamptz | denormalized or derived from session |
| ends_at | timestamptz | |

**Integrity**: Prefer **single source of truth** for times on `activity_sessions`; bookings
reference session and copy window only if needed for exclusion constraint. Implementation chooses
minimal duplication; document in migration comments.

### `children`

Scoped to org + guardian membership.

| Column | Type | Notes |
|--------|------|--------|
| id | uuid | PK |
| organization_id | uuid | FK |
| guardian_user_id | uuid | FK → profiles(id); must have `is_parent` membership |
| first_name | text | spec: minimal PII |
| birth_date | date | |
| created_at | timestamptz | |

**Constraint**: Guardian must have active `org_memberships` row for org with `is_parent = true`.

### `enrollments`

| Column | Type | Notes |
|--------|------|--------|
| id | uuid | PK |
| organization_id | uuid | FK |
| child_id | uuid | FK |
| activity_id | uuid | FK |
| status | text | `active` \| `cancelled` \| … |
| created_at | timestamptz | |

Unique partial index: one **active** enrollment per `(child_id, activity_id)` if product requires.

### `waitlist_entries`

| Column | Type | Notes |
|--------|------|--------|
| id | uuid | PK |
| organization_id | uuid | FK |
| child_id | uuid | FK |
| activity_id | uuid | FK |
| position | int | FIFO ordering within activity |
| status | text | `waiting` \| `offered` \| `expired` \| `enrolled` |
| offered_at | timestamptz | nullable |
| offer_expires_at | timestamptz | nullable (48h rule) |
| created_at | timestamptz | |

Unique: `(child_id, activity_id)` while `status in ('waiting','offered')`—partial unique index.

### `audit_logs` (optional v1 slice)

| Column | Type | Notes |
|--------|------|--------|
| id | uuid | PK |
| organization_id | uuid | FK |
| actor_user_id | uuid | FK → profiles |
| action | text | coarse verb |
| entity | text | table/key |
| meta | jsonb | no child PII |
| created_at | timestamptz | |

## RLS (outline)

- **`organizations`**: read if member; update if owner/admin.
- **`org_memberships`**: users read own rows; admins read/manage org rows.
- **`children`**: guardian reads/swrites own org’s children; staff per capability.
- **`activities`, `sessions`, `facilities`, `bookings`**: staff read/write per permission; parents
  read **published** activities only.
- **`enrollments`, `waitlist_entries`**: guardian for own children; staff manage.

Exact policy SQL ships in migrations; **comment** each policy with intent (principle III).

## Indexing

- `(organization_id, slug)` on organizations (slug already unique global or per slug uniqueness—if
  global slug, unique on slug alone).
- `(organization_id, published)` on activities for parent catalog.
- `(facility_id, starts_at, ends_at)` for overlap detection.
- `(activity_id, position)` on waitlist_entries.

## Validation rules (application)

- Enrollment: capacity, **FR-006** age at reference date, org enrollment policy (FR-007).
- Waitlist: same age checks (FR-012 paragraph in spec).
- Invitations: resolve to existing `profiles` / `auth.users` by email when accepted.
