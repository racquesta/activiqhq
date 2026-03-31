# Supabase

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli).
2. From repo root, if `config.toml` is missing, run: `supabase init`
3. `supabase start` — local Postgres + Auth (matches Vercel deployments best).
4. `supabase db reset` — reapplies `migrations/` on local.

Migrations reference `auth.users` (Supabase). Applying the same files to **Docker Compose Postgres
only** will fail at `profiles` until you strip or mock that FK—use Supabase locally for real
work.

**Aurora rehearsal**: use `psql` against Aurora-compatible Postgres; replace or duplicate `auth`
coupling per [research.md](../specs/001-kids-activities-platform/research.md).
