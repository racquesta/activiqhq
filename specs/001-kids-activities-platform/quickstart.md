# Quickstart: ActiviqHQ local development

## Prerequisites

- Node.js 20+
- npm (or pnpm)
- Docker Desktop (for Supabase CLI or Compose)

## 1. Install dependencies

```bash
cd /Users/ronessaacquesta/activiqhq
npm install
```

## 2. Supabase CLI (recommended full stack)

Install: [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
cd /Users/ronessaacquesta/activiqhq
supabase init          # if not already present
supabase start
```

Copy printed **API URL** and **anon key** into `.env.local` (see `.env.local.example`).

Apply migrations:

```bash
supabase db reset      # local only; applies supabase/migrations/*
```

## 3. Optional: Docker Compose Postgres only

For schema-only testing without Supabase Auth:

```bash
docker compose up -d postgres
```

Set `DATABASE_URL=postgresql://activiq:activiq@localhost:5432/activiq` and run migrations with
`psql` or a migrate tool. **Sign-in flows require** Supabase Auth (use `supabase start` or a dev
project URL).

## 4. Next.js

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 5. Vercel + Supabase (production shape)

- Create a **Supabase** project; run same migrations against it (`supabase db push` or CI).
- In Vercel: set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`; never expose service
  role to the client.
- Connect repo; deploy.

## 6. Stripe (future)

Leave env placeholders unused until billing spec; no webhooks in v1.

## Troubleshooting

- **RLS blocks all rows**: confirm JWT present and `org_memberships` seed data exists for test user.
- **Migration fails on auth FK**: run against Supabase (local `supabase start`), not vanilla Postgres
  without `auth` schema.
