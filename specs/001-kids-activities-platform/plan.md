# Implementation Plan: Kids Activities Class Management Platform

**Branch**: `001-kids-activities-platform` | **Date**: 2026-03-30 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-kids-activities-platform/spec.md`  
**Stack note**: Next.js + Tailwind (frontend), Supabase (Postgres + Auth + RLS) for Vercel; local dev via Supabase CLI and/or Docker Postgres; Stripe deferred; migrations written for Postgres portability toward AWS Aurora.

## Summary

Build **ActiviqHQ**: a multi-tenant class-management product for youth activities (dance, sports with
facility scheduling, parent enrollment, FIFO waitlists, role-based staff UI). **Next.js 16 (App
Router)** and **Tailwind CSS 4** deliver the web UI using the **ActiviqHQ visual identity** (light
surfaces, Plus Jakarta Sans, blue primary accent, semantic activity colors). **Supabase** provides
managed Postgres, **Auth** (email/password + magic link per spec), Row Level Security for tenant
isolation, and Edge-friendly clients from **Vercel**. **Local development** uses **Supabase CLI**
(`supabase start`) so Postgres + Auth match production behavior; a **Docker Compose** Postgres service
is available for applying the same migration SQL without the full Supabase stack when teams need
schema-only work (Auth must still target a Supabase project or local stack for end-to-end sign-in).
**SQL migrations** live under `supabase/migrations/` as plain Postgres DDL compatible with **Aurora
PostgreSQL** (avoid Supabase-only SQL outside documented exceptions; prefer `gen_random_uuid()`;
document `auth` schema coupling). **Stripe** is architectural placeholder only (no implementation in
this phase).

## Technical Context

**Language/Version**: TypeScript 5.x, Node 20+ (align with Vercel defaults)  
**Primary Dependencies**: Next.js 16.2, React 19.2, Tailwind CSS 4, `@supabase/supabase-js`,
`@supabase/ssr` (or current SSR package per Supabase Next guide), ESLint 9 / eslint-config-next  
**Storage**: PostgreSQL via **Supabase** (hosted on Vercel deployments); same schema applied
locally  
**Testing**: Vitest or Jest + Testing Library for units/components; Playwright for critical E2E
(org context, RLS smoke); contract checks optional via Zod on API boundaries  
**Target Platform**: Web (responsive); deploy **Vercel**; database **Supabase** (EU/US region TBD in
ops)  
**Project Type**: Web application (monolith Next.js with server components, server actions / route
handlers)  
**Performance Goals**: Dashboard interactions p95 under 500ms on warm functions for typical reads;
calendar/week views remain usable on mid-tier mobile (scroll 60fps where possible); facility conflict
checks O(n) per resource with bounded sessions per org (document index strategy)  
**Constraints**: Strict **multi-tenant isolation** (RLS + application org context); **minimal child
PII** (first name + birthday per spec); **no Stripe** in v1 codebase beyond env placeholder;
migrations must apply on **vanilla Postgres 15+** for Aurora rehearsal  
**Scale/Scope**: MVP aligned to three user-story tranches (staff/org, catalog + facilities,
parents + enrollment + waitlist); English-first UI; advanced analytics deferred

### Environment matrix

| Environment | App | Database / Auth |
|-------------|-----|-----------------|
| Local (full) | `next dev` | `supabase start` → local Postgres + GoTrue |
| Local (schema-only) | `next dev` | Docker Compose Postgres + migrations (Auth limited) |
| Production | Vercel | Hosted Supabase project |

## Constitution Check

*GATE: Passed at planning. Re-check after Phase 1 design: **Pass** — plan favors clear layering (UI →
server modules → Supabase), documents multi-tenant and auth coupling for comments, and avoids scope
creep (Stripe deferred).*

Per `.specify/memory/constitution.md`:

- **Clarity & simplicity**: Single Next app; Supabase for auth/data avoids bespoke auth server.
  Tradeoff: *RLS policy complexity* — document policies beside DDL; complex joins commented in SQL
  and server helpers.
- **Performance vs readability**: Hot paths (enrollment cap, waitlist advance, facility overlap) use
  indexed queries and transactional constraints; document in `data-model.md`.
- **Commenting**: Areas needing explicit comments: **RLS policies**, **org context resolution**,
  **waitlist FIFO + 48h offer**, **age eligibility date**, **facility overlap detection**.
- **Reuse**: Shared modules for `orgContext`, `auth`, `supabase/server`, validation schemas (Zod),
  design tokens (Tailwind theme).
- **Spec fidelity**: Matches [spec.md](./spec.md); Stripe and Aurora are forward-compatible hooks,
  not v1 features.

## Visual Identity (ActiviqHQ)

Implementers MUST align UI with this system (tokens map to `globals.css` / Tailwind `@theme`).

**Core**: Light, clean, structured layouts, rounded corners, subtle motion (abstract ribbons—not
literal kids/sports mascot UI). **Clarity over decoration**; **color = meaning** (activity types,
calendar blocks).

**Neutrals**: Background `#FAFAFA`, surface/card `#FFFFFF`, border `#E5E7EB`, text primary `#0F172A`,
secondary `#64748B`.

**Brand / activity**: Red `#EF4444`, Yellow `#FACC15`, Blue `#3B82F6`, Green `#22C55E` (chips,
calendar, tags).

**Primary accent (CTA)**: `#3B82F6` / hover `#2563EB` / active `#1D4ED8`.

**Utility**: Success `#22C55E`, Warning `#F59E0B`, Error `#EF4444`.

**Gradients**: Flow motif red→orange→yellow and blue→green; soft wash white→`#EEF2FF` or `#ECFEFF`
for heroes—use sparingly.

**Typography**: **Plus Jakarta Sans** primary, **Inter** fallback. Scale: H1 48px bold, H2 36px
semibold, H3 28px semibold; body 16px / large 18px / small 14px; button 16px medium; label 12px
medium.

**Layout**: Max width 1200px, 12-col grid, 24px gutter, **8pt spacing** (4/8/12/16/24/32/48/64).

**Components**: Primary button blue, white label, radius 12px; secondary white + border `#E5E7EB`;
cards white, radius 16px, shadow subtle `0 4px 20px 5%`; inputs radius 10px, focus ring blue.

**Voice**: Clear, direct, functional (e.g. “Manage your classes in one place.”).

**Don’t**: Full-page dark chrome; decorative excess; “kids app” toy aesthetic.

## Phase 0 & Research

See [research.md](./research.md). All `NEEDS CLARIFICATION` items from this plan’s first draft were
resolved there (local dev, Aurora posture, auth strategy, Stripe deferral).

## Phase 1 Design

- [data-model.md](./data-model.md) — entities, constraints, RLS overview, indexing.
- [contracts/](./contracts/) — interface conventions for Server Actions / HTTP boundaries.
- [quickstart.md](./quickstart.md) — clone → env → Supabase local → run app.

### Post-design Constitution Check

- **Pass**: Data model ties every tenant row to `organization_id` where applicable; auth linkage to
  `auth.users` is explicit; facility overlap and waitlist rules map to testable constraints;
  duplicate logic for age checks called out for one shared helper in app code.

## Project Structure

### Documentation (this feature)

```text
specs/001-kids-activities-platform/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── README.md
└── tasks.md          # Phase 2 (speckit.tasks)
```

### Source Code (repository root)

```text
activiqhq/
├── app/                      # Next.js App Router (routes, layouts, server components)
├── components/               # Shared UI (buttons, cards, calendar primitives)
├── lib/
│   ├── supabase/             # createBrowserClient, createServerClient, cookies helpers
│   ├── auth/                 # session + org context helpers
│   ├── validations/          # Zod schemas shared server/client
│   └── design-tokens.ts      # optional typed token mirror for non-Tailwind use
├── supabase/
│   ├── config.toml           # Supabase CLI (generated/updated via supabase init)
│   └── migrations/           # Ordered SQL; Aurora-compatible subset documented in research
├── docker-compose.yml        # Optional local Postgres for schema-only workflow
├── public/
├── package.json
└── specs/
```

**Structure Decision**: Single **Next.js** repository (no separate SPA/API repo). **Supabase**
holds data and auth. Business logic lives in **server modules** + **Server Actions** / **route
handlers** under `app/`, colocated by route segment where helpful.

## Complexity Tracking

> No constitution violations requiring justification. Aurora cutover and Stripe will introduce
> complexity in later phases, explicitly out of MVP scope.
