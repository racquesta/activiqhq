# Quickstart: Kids Activities Class Management Platform

## Prerequisites

- Node.js 20+
- npm 10+
- Docker (for Supabase local stack)

## 1) Install dependencies

```bash
npm install
```

## 2) Start local Supabase

```bash
npm run db:start
```

If this is the first run, images may take several minutes to download.

## 3) Apply database migrations

```bash
npm run db:reset
```

## 4) Configure local environment variables

Create `.env.local` in repo root:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from `npm run db:status`>
SUPABASE_SERVICE_ROLE_KEY=<from `npm run db:status`>
NEXT_PUBLIC_APP_BASE_URL=http://localhost:3001
```

Optional branding/theme variables (if used by frontend token system):

```bash
NEXT_PUBLIC_BRAND_FONT="Plus Jakarta Sans"
NEXT_PUBLIC_BRAND_PRIMARY=#3B82F6
```

## 5) Run the app

```bash
npm run dev
```

Open `http://localhost:3001`.

## 6) Visual style references

- Brand icon: `activiqhq_icon_clipped.svg`
- Landing reference: `landing_sample.png`

Use these with the visual identity rules from the plan to keep UI output consistent.
