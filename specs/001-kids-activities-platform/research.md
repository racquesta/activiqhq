# Research: Kids Activities Class Management Platform

## Decision 1: Frontend architecture uses Next.js App Router + Tailwind tokens

**Decision**: Keep a single Next.js App Router app with Tailwind CSS utility classes and
brand tokens in `app/globals.css`.

**Rationale**: Matches current repository shape, reduces overhead, and supports both marketing
and authenticated organization experiences in one deployable unit.

**Alternatives considered**:
- Split frontend/backend into separate repos (rejected: higher complexity for MVP).
- CSS-in-JS token system (rejected: unnecessary abstraction for initial scope).

## Decision 2: Supabase as initial backend system of record

**Decision**: Use Supabase Postgres with migration-first schema changes and Supabase Auth for
user identity; derive org membership/roles from app tables.

**Rationale**: Fastest path to robust auth + database with RLS support and local dev tooling.

**Alternatives considered**:
- Self-hosted Postgres + custom auth (rejected: slower to ship and higher security burden).
- Firebase-only backend (rejected: relational policy model less natural for this domain).

## Decision 3: Multi-tenant routing by globally unique org slug

**Decision**: Tenant context is resolved from `/o/{orgSlug}` routes and validated against
guardian/staff memberships on each protected request.

**Rationale**: Clear dedicated organization URL model and predictable guardrail for tenant
isolation.

**Alternatives considered**:
- Tenant selection post-login only (rejected: conflicts with dedicated URL requirement).
- Subdomain-per-org for MVP (rejected: DNS and environment complexity).

## Decision 4: Role template model for staff permissions

**Decision**: Keep base roles (`owner`, `admin`, `instructor`, `coach`) and add limited
admin-managed capability toggles for `admin` and `instructor/coach`.

**Rationale**: Satisfies configurable permissions requirement while avoiding full ACL matrix
complexity.

**Alternatives considered**:
- Static role permissions only (rejected: misses clarified requirement).
- Per-user permission matrix (rejected: heavy UX and auditing complexity for MVP).

## Decision 5: Enrollment policy and duplicate-child handling

**Decision**: Enforce a single org-wide concurrent activity limit per child and surface a
duplicate warning (exact first name + birthday in organization) requiring confirmation.

**Rationale**: Aligns to clarification answers and keeps enrollment rules simple and testable.

**Alternatives considered**:
- Program-level limit policies (rejected for MVP scope).
- Hard duplicate blocking (rejected: can block legitimate edge cases).

## Decision 6: Local environment and developer workflow

**Decision**: Standardize local setup around `.env.local` + Supabase CLI commands.

**Rationale**: Predictable onboarding, easy parity between developers, and avoids hidden
machine-specific configuration.

**Alternatives considered**:
- Global shell-only env vars (rejected: brittle team onboarding).
- Committing concrete env files (rejected: security and portability risk).
