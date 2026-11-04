# Nexus

**Enterprise facility and IoT operations platform.** It manages customers, their sites, the equipment installed there, connected IoT devices, and the work orders and incidents that keep it all running.

> Portfolio project built with **Angular 22 + Supabase (PostgreSQL)**. All data is fictional and all telemetry is simulated.

**Live demo:** https://kareemfahmy.github.io/Nexus/ (click **Explore the demo** for read-only guest access)

[![CI and deploy](https://github.com/kareemfahmy/Nexus/actions/workflows/ci-deploy.yml/badge.svg)](https://github.com/kareemfahmy/Nexus/actions/workflows/ci-deploy.yml)

**Status:** Milestone 6 (dashboard) complete. Milestone 5 (work orders and incidents) is next after deployment. See [roadmap](#roadmap).

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Angular 22 (standalone, zoneless, signals, OnPush by default), TypeScript strict, SCSS |
| Forms | Typed Reactive Forms |
| UI | Custom design-token system (`src/styles`) + Angular CDK + `@angular/aria` + Lucide icons |
| Backend | Supabase: PostgreSQL, Auth, Row Level Security, generated TypeScript types |
| Tests | Vitest (unit), Playwright (e2e, Milestone 10) |

## Getting started

Requirements: Node 22+, npm 10+.

```bash
npm install
```

```bash
npm start
```

The app runs at http://localhost:4200. Click **Explore the demo (read-only)** for guest access.

```bash
npm run build
```

```bash
npm test -- --watch=false
```

### Environment configuration

Supabase settings live in `src/environments/environment*.ts`:

| Key | Where to find it |
|---|---|
| `supabase.url` | Supabase dashboard → Project Settings → API |
| `supabase.publishableKey` | Same page, the `sb_publishable_…` key |

The publishable key is **public by design**. Data is protected by Row Level Security in Postgres, not by hiding the key. **Never** put the `service_role` key in frontend code.

### Supabase setup

1. Create a Supabase project and copy its URL and publishable key into the environment files.
2. Enable **Authentication → Sign In / Providers → Anonymous sign-ins** so the read-only guest demo works. Turning on CAPTCHA or rate limiting is recommended.
3. Apply the migrations in order. Paste each file from `supabase/migrations/` into the SQL editor, or run:
   ```bash
   for f in supabase/migrations/*.sql; do psql "$DATABASE_URL" -1 -f "$f"; done
   ```
   `DATABASE_URL` is the connection string from Project Settings → Database. It stays on your machine and never goes in the app.
4. Load the demo data. This is repeatable: it wipes and regenerates demo rows, but keeps real users:
   ```bash
   psql "$DATABASE_URL" -f supabase/seed.sql
   ```
5. Verify the security rules. The expected output is `RLS_TESTS_PASSED: 25 checks`:
   ```bash
   psql "$DATABASE_URL" -f supabase/tests/rls_and_rules.test.sql
   ```
6. Regenerate TypeScript types after any schema change, and overwrite `src/app/core/supabase/database.types.ts` with the output:
   ```bash
   npx supabase gen types typescript --project-id <project-ref>
   ```
7. To write data, create a user under Authentication → Users and promote them. See [docs/rls.md](docs/rls.md#promoting-a-user).

### Demo dataset

| Entity | Rows |
|---|---|
| Customers / sites / contacts | 20 / 56 / 96 |
| Equipment / IoT devices | 284 / 287 |
| Telemetry readings (hourly, 14 days) | ~135,000 |
| Work orders / incidents | 134 / 62 |
| Incident comments / timeline events | ~120 / 217 |

All names, addresses and identifiers are fictional. Timestamps are relative to when the seed runs, so the demo always looks current.

## Deployment

`.github/workflows/ci-deploy.yml` runs on every push and pull request:

1. `npm ci`
2. unit tests (Vitest)
3. the design-token check
4. a production build with `--base-href /<repo>/`

Pushes to the default branch then deploy `dist/nexus/browser` to **GitHub Pages**. GitHub Pages has no URL rewrites, so the workflow copies `index.html` to `404.html`. That way deep links such as `/Nexus/sites/<id>` still load the Angular router.

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

The Supabase URL and publishable key are compiled into the bundle. That's expected: access is enforced by Row Level Security (see [docs/rls.md](docs/rls.md)).

## Project structure

```
src/app/
  core/        app-wide singletons: Supabase client token, auth, layout shell
  shared/ui/   reusable presentational components (button, badges, empty state, toast, dialog…)
  features/    one folder per module, lazy-loaded (customers, sites, equipment, devices…)
src/styles/    design tokens: primitives → semantic → component
design-system/ design rules (MASTER.md) produced with the ui-ux-pro-max skill
supabase/      migrations (source of truth), seed.sql, RLS tests
docs/          architecture, security model (rls.md), decisions (ADRs), approved plan
```

More detail is in [docs/architecture.md](docs/architecture.md).

## Roadmap

| # | Milestone | Status |
|---|---|---|
| 1 | Product architecture and planning | ✅ |
| 2a | Foundation: shell, routing, design system, auth | ✅ |
| 2b | Database: schema, RLS, seed data, generated types | ✅ |
| 3 | Customers and Sites | ✅ |
| 4 | Assets: equipment, devices, telemetry | ✅ |
| 5 | Operations: work orders and incidents | |
| 6 | Dashboard | ✅ |
| 7 | Deploy (GitHub Pages + CI) | ✅ |

The full plan is in [docs/architecture-plan.md](docs/architecture-plan.md).
