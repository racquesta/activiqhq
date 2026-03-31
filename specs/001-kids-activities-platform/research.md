# Research: Kids Activities Platform (001-kids-activities-platform)

Consolidated decisions for implementation planning. Resolves environment and portability questions
raised in Technical Context.

---

## 1. Local development: Supabase CLI vs raw Postgres

**Decision**: Primary local path is **Supabase CLI** (`supabase start`). It runs **PostgreSQL in
Docker** together with **GoTrue** (Auth), closely matching Vercel + hosted Supabase.

**Rationale**: The product requires **email/password + magic link** and **RLS**. A database-only
container without Auth forces duplicate or mock auth work and drifts from production.

**Alternatives considered**:

- **Docker Compose Postgres only**: Good for applying migration SQL in CI or quick DDL checks; keep
  `docker-compose.yml` as secondary path. Document that full sign-in flows still need Supabase Auth
  (local or shared dev project).
- **Hosted Supabase dev project for all local runs**: Simple for small teams; adds network latency
  and shared-db risk; optional for contractors.

---

## 2. Vercel + Supabase wiring

**Decision**: Use **@supabase/ssr** (or current documented package) per Supabase Next.js guide;
store `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and **server-only**
`SUPABASE_SERVICE_ROLE_KEY` only in server routes if needed for admin automation (avoid exposing).
Middleware or layout helper resolves session; **active org** comes from subdomain, path segment, or
cookie set after org URL sign-in (implementation detail in tasks phase).

**Rationale**: Official patterns stay compatible with Next.js App Router and cookie-based sessions.

**Alternatives considered**: Custom JWT API—rejected; reinvents Auth.

---

## 3. Aurora migration posture

**Decision**: Maintain **versioned SQL migrations** in `supabase/migrations/` using **portable
PostgreSQL** features: `gen_random_uuid()`, `timestamptz`, explicit `public.` schema, **avoid**
nonstandard extensions in business tables. Document Supabase-specific dependencies:

- **auth.users**: `public.profiles.id` references `auth.users (id)`; Aurora cutover requires a
  planned **identity migration** (duplicate users table or external IdP).
- **Supabase Realtime / Storage**: not v1 requirements; omit.

**Rationale**: Aurora PostgreSQL is wire-compatible for application schemas; auth coupling is the
main portability boundary.

**Alternatives considered**: ORM-only migrations without SQL files—rejected; weak for DBA review and
Aurora rehearsal.

---

## 4. Stripe (deferred)

**Decision**: **No** Stripe code, webhooks, or schema in MVP. Add `.env.local.example` placeholders
`STRIPE_SECRET_KEY=`, `STRIPE_WEBHOOK_SECRET=` with comment “Future phase”.

**Rationale**: Feature spec excludes payments; avoids PCI scope and split-brain billing.

**Alternatives considered**: Stub `customers` table now—rejected as YAGNI.

---

## 5. Facility double-booking and transactions

**Decision**: Enforce non-overlap with **EXCLUDE USING gist** (if `tsrange` + btree_gist enabled) or
**deferrable constraint** alternative: **transaction + `SELECT … FOR UPDATE`** on facility row plus
indexed window check, matching spec **hard block**. Prefer SQL constraint or unique exclusion when
possible for clarity; otherwise document transactional check in application with comment citing
spec **FR-008**.

**Rationale**: Hard-block semantics must survive concurrent staff saves.

**Alternatives considered**: Warning-only UI—rejected by spec clarification.

---

## 6. Waitlist FIFO + 48h offer

**Decision**: Implement with **status columns** (`pending`, `offered`, `expired`) and **strict
ordering** (`position` or `joined_at` + id tie-break). **Scheduled job** (Vercel Cron or database
`pg_cron` if available) or **lazy evaluation** on enrollment cancel to advance queue; document
tradeoff in tasks (MVP can use transactional handler on cancel + time-based expiry check on read).

**Rationale**: Spec requires testable FIFO and 48-hour window.

---

## 7. Age eligibility

**Decision**: Compute age in application layer using **UTC date** normalization from child birthday
and reference date (**first session start** else **enrollment attempt** per spec). Store bounds on
`activities` as smallint or nullable ints; null means no gate.

**Rationale**: Keeps SQL simple; edge cases (leap years, time zones) get unit tests and comments.

---

## 8. Tailwind + brand fonts

**Decision**: Load **Plus Jakarta Sans** via `next/font/google`; map tokens in `@theme` (Tailwind v4)
to ActiviqHQ neutrals and accents; remove default dark-scheme flip for product shell (light-first
per brand).

**Rationale**: Matches visual identity; reduces manual `className` drift.

**Alternatives considered**: CSS variables only—hybrid with Tailwind theme is sufficient.
