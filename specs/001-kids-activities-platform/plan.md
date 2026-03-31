# Implementation Plan: Kids Activities Class Management Platform

**Branch**: `001-kids-activities-platform` | **Date**: 2026-03-31 | **Spec**: `/specs/001-kids-activities-platform/spec.md`
**Input**: Feature specification from `/specs/001-kids-activities-platform/spec.md`

## Summary

Build a multi-tenant class management platform for organizations, staff, and guardians using
Next.js + Tailwind CSS for frontend and Supabase Postgres for backend data/auth foundation.
MVP focuses on org setup, role-based access with limited template customization, guardian/child
onboarding via unique org URLs, and org-wide activity enrollment limits with duplicate warnings.

## Technical Context

**Language/Version**: TypeScript 5.x, Node 20+  
**Primary Dependencies**: Next.js 16.x, React 19.x, Tailwind CSS 4, Supabase JS/SSR, next-intl  
**Storage**: Supabase Postgres (local via Supabase CLI, prod via Supabase project)  
**Testing**: ESLint + TypeScript checks, React component tests, integration tests for critical flows  
**Target Platform**: Web app (modern desktop/mobile browsers)  
**Project Type**: Single Next.js web application  
**Performance Goals**: p95 page navigation under 500ms on cached pages; core writes under 300ms p95  
**Constraints**: Tenant isolation by org slug context; minimal child PII (first name + birthday); local env vars required  
**Scale/Scope**: MVP for small-to-mid organizations; 1-5 org admins, up to 10k guardians per org

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Per `.specify/memory/constitution.md`:

- **Clarity & simplicity**: PASS — keep architecture to one Next.js app with Supabase-backed
  services and straightforward routing by organization slug.
- **Performance vs readability**: PASS — query design and indexes are planned around p95 goals;
  readability preserved with documented service boundaries.
- **Commenting**: PASS — non-obvious logic areas called out (role template evaluation, tenant
  context resolution, duplicate-child detection).
- **Reuse**: PASS — shared auth/org context loaders and policy utilities centralized in `lib/`.
- **Spec fidelity**: PASS — all FRs from spec map directly to planned modules and contracts.
- **Reviewable chunking**: PASS — tasks will be split by vertical slices and capped to small,
  independently reviewable units.

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
└── tasks.md
```

### Source Code (repository root)

```text
app/
├── (marketing)/
├── o/[orgSlug]/
├── api/
└── globals.css

components/
├── ui/
└── brand/

lib/
├── auth/
├── org/
├── supabase/
└── validations/

messages/
└── en.json

supabase/
└── migrations/
```

**Structure Decision**: Use existing Next.js App Router project with co-located UI, auth,
and tenant context modules; Supabase migrations remain source of truth for data model changes.

## Phase 0: Research Output

See `/specs/001-kids-activities-platform/research.md` for selected decisions and alternatives.

## Phase 1: Design & Contracts Output

- Data model: `/specs/001-kids-activities-platform/data-model.md`
- Contracts: `/specs/001-kids-activities-platform/contracts/README.md`
- Local setup and envs: `/specs/001-kids-activities-platform/quickstart.md`

## Design Notes: Visual Identity Integration

Frontend implementation MUST follow provided ActiviqHQ visual identity:

- Use `Plus Jakarta Sans` with `Inter` fallback.
- Use neutral base (`#FAFAFA`, `#FFFFFF`) and semantic text colors.
- Map brand activity colors to tags/calendar/events, not decorative overuse.
- Keep soft gradient washes and flowing ribbon motifs subtle and section-scoped.
- Respect component tokens: button radius 12px, card radius 16px, input radius 10px.
- Reuse `activiqhq_icon_clipped.svg` and `landing_sample.png` as visual references for spacing,
  density, and hero composition.

## Post-Design Constitution Re-Check

- **Result**: PASS
- No constitutional violations introduced by design artifacts.
- No unresolved clarifications remain for `/speckit.tasks`.
