# Nexus

**Enterprise facility and IoT operations platform.** It manages customers, their sites, the equipment installed there, connected IoT devices, and the work orders and incidents that keep it all running.

> Portfolio project built with **Angular 22 + Supabase (PostgreSQL)**. All data is fictional and all telemetry is simulated.

**Status:** Milestone 2a (foundation) complete. See [roadmap](#roadmap).

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
3. Apply database migrations and seed data. *Arrives in Milestone 2b (`supabase/migrations`, `supabase/seed.sql`).*

## Project structure

```
src/app/
  core/        app-wide singletons: Supabase client token, auth, layout shell
  shared/ui/   reusable presentational components (button, badges, empty state, toast, dialog…)
  features/    one folder per module, lazy-loaded (customers, sites, equipment, devices…)
src/styles/    design tokens: primitives → semantic → component
design-system/ design rules (MASTER.md) produced with the ui-ux-pro-max skill
docs/          architecture, decisions (ADRs), approved plan
```

More detail is in [docs/architecture.md](docs/architecture.md).

## Roadmap

| # | Milestone | Status |
|---|---|---|
| 1 | Product architecture and planning | ✅ |
| 2a | Foundation: shell, routing, design system, auth | ✅ |
| 2b | Database: schema, RLS, seed data, generated types | ⏳ |
| 3 | Customers and Sites | |
| 4 | Equipment | |
| 5 | IoT Devices | |
| 6 | Telemetry and monitoring | |
| 7 | Work orders | |
| 8 | Incidents | |
| 9 | Dashboard and Analytics | |
| 10 | Refinement, accessibility, e2e, deployment | |

The full plan is in [docs/architecture-plan.md](docs/architecture-plan.md).
