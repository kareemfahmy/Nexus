# Nexus: Architecture, Design Direction and Roadmap (Milestone 1)

## Context

Nexus is a portfolio-grade Angular + Supabase app for facility and IoT operations. It takes its domain from Facility Smart Grid (FSG), but the UX is redesigned from scratch. This document is Milestone 1, planning only. Nothing gets initialized, installed or committed until it's approved.

**Decisions already made (from Q&A):**
- **Forms:** Reactive Forms. This deliberately departs from the angular-developer skill's Signal Forms default (see the Risks section).
- **Demo access:** guest read-only access (Supabase anonymous auth) plus real login for writes.
- **UI layer:** custom SCSS design tokens + Angular CDK + `@angular/aria`. No component library.
- **Theme:** light only. Tokens are still split into layers so dark mode can be added later without refactoring.

**Honest assessment of the brief:** 8/10 as a portfolio concept. The domain is real, the data model has genuine depth, and it maps directly to your FSG experience, which is a strong interview story. The biggest risk is breadth: 9 modules done shallowly is worse than 5 done excellently. I've ordered the milestones so Customers, Sites, Equipment and Devices are deep and polished first. Analytics and other extras can shrink if time runs out.

---

## A. Environment findings

| Item | Finding |
|---|---|
| Repo | Branch `claude/gifted-mendel-gxx7m8`. Contains only installed skills (`.agents/skills/*`, `.claude/skills/*`, `skills-lock.json`). No Angular project yet. |
| Node / npm | Node 22.23.4, npm 10.9.9. The `ng` CLI isn't installed globally, so the skill rule applies: use `npx @angular/cli@latest`. |
| Latest packages | `@angular/core` 22.2.4, `@angular/cdk` / `@angular/aria` 22.2.5, `@supabase/supabase-js` 2.118.0, `echarts` 6.1.0, `ngx-echarts` 22.0.0, `lucide-angular` 1.0.0 |
| Supabase | A hosted project named **Nexus** already exists (`csblzgxsskyfpgsevlgd`, eu-central-1, Postgres 17, healthy). It has zero tables and zero migrations, so it's a clean slate. The Supabase MCP tools are connected. |
| Tooling | `psql` and `docker` are available, so the local Supabase CLI stack is possible. |

## B. Skill orchestration (read from the actual SKILL.md files)

| Skill | What it actually contains | How Nexus uses it |
|---|---|---|
| **angular-new-app** | `npx ng new … --interactive=false --ai-config=…`. Generate files with the CLI. `ng add tailwindcss` is optional. | Milestone 2 init: `npx @angular/cli@latest new nexus --directory=. --style=scss --ssr=false --prefix=nx --ai-config=claude --interactive=false`. Every component, service and guard gets scaffolded with `ng generate`. |
| **angular-developer** | Version-aware rules. Run `ng build` after every change. References on signals, `resource`, `linkedSignal`, DI, routing, guards, resolvers, forms, `@angular/aria`, Vitest, harnesses. | The main implementation standard. Each milestone loads the references relevant to it (listed in the roadmap). The Angular MCP server (`ng mcp`, `get_best_practices`) is used once the CLI is installed. |
| **ui-ux-pro-max** | A priority-ranked UX rulebook (a11y > interaction > performance > style > layout…). The `search.py` CLI covers design systems, domains and stacks, and can persist `MASTER.md` and per-page overrides. | The design QA gate. Its design-system output is persisted to `design-system/nexus/MASTER.md` in Milestone 2a, with page overrides for dense pages (equipment, telemetry). The Quick Reference §1–§3 checklist runs at the end of every UI milestone. |
| **design-system** | A three-layer token model (primitive → semantic → component), component state specs, and `validate-tokens.cjs` for catching hardcoded values. | Defines the SCSS token architecture. `validate-tokens.cjs --dir src/` runs as a check so components never contain raw hex values. |
| **ui-styling** | shadcn/ui + Tailwind + canvas. This is **React-only**. | Its components aren't used. Only its accessibility, theming and table principles are applied, translated to CDK + `@angular/aria`. |
| **brand** | Voice framework, visual identity, `docs/brand-guidelines.md` → token sync. | A short Nexus brand guide (voice: precise, calm, operational). It shapes microcopy (empty states, errors, toasts) and the colour primitives. |
| **design** | A router to sub-skills, plus logo and icon generation (needs a Gemini API key). | A simple SVG logo mark, hand-built if no Gemini key is available. Otherwise low use. |
| **banner-design** | Social and README banners (Gemini + Chrome screenshot pipeline). | Postponed to Milestone 10: README hero and LinkedIn banner for the portfolio launch. |
| **slides** | HTML pitch decks with Chart.js. | Optional after Milestone 10: a 6-slide "Nexus architecture" deck for interviews. |

**Conflict resolution applied:**
- ui-ux-pro-max suggested a **dark** theme with **Fira Code headings**. I'm overriding both. Light was your choice. A monospace heading font reads as a dev tool rather than an ops product, so I've picked IBM Plex Sans for UI and IBM Plex Mono for IDs and numbers. This keeps the tool's "data, precise" intent and still gives tabular figures.
- angular-developer prefers Signal Forms, but you chose Reactive Forms. Everything else follows the skill: signals, `resource()`, `inject()`, the v20+ naming style, `@if`/`@for`, `input()`/`output()`, OnPush, zoneless.

## C. FSG screenshot analysis → what Nexus fixes

| FSG today (observed) | Problem | Nexus approach |
|---|---|---|
| 25+ flat items in the site sidebar, mixing billing, EMO, utilities and ops | Cognitive overload, no grouping | A global sidebar with 8 grouped modules. Site context uses a compact tab bar with 6 tabs. Billing, utilities and EMO are out of scope. |
| Equipment Overview shows one wide table per category, each with its own "Display Columns" and horizontal scroll, and headers truncated ("Service Re…", "Replaceme…") | Hard to scan, wasted vertical space | One table with **collapsible category groups**. Each group header shows the count plus a health summary. Column presets are chosen per category, and full header text appears in a tooltip. |
| Many columns full of "Not Evaluated" / "VOIDED" | Noise | Solution-evaluation fields are collapsed into one "Solutions" chip cell that shows counts. Details live on the equipment page. |
| Equipment page has 6+ collapsed accordions (Details, Installed Solutions, Audit Trails, Notes, Service History, Control…) | Everything hidden, too many clicks | An **equipment detail page** with a summary header, an Overview tab (specs, linked devices, monitoring card) and **one unified Activity timeline** (notes + audit + service/work orders, filterable). |
| Thermostat shown as a skeuomorphic thermometer image | Low information density, dated | A compact **state card**: room temp, setpoints, mode, occupancy, humidity, last update with a stale warning. Next to it sits a telemetry chart with a 24h/7d/30d switch. Labelled "Simulated". |
| Equipment list entries carry unlabelled icons (bell, leaf, "20") | Meaning conveyed by glyph alone | Icon + text badges with accessible names (ui-ux-pro-max `color-not-only`, `icon-context`). |
| Incident and work order tables show raw `false` booleans and View/Edit/Delete on every row | Visual clutter, delete too easy | Rows click through to details. A kebab menu holds row actions. Booleans are rendered as badges. Delete sits behind a confirm dialog and requires the admin role. |
| No summary before details | Users must open records to understand state | Every list page gets a KPI strip (small, not oversized). Every detail page gets a summary header. |
| No breadcrumbs. Back button only. | Lost context | Breadcrumbs: `Customers › Acme Foods › IHOP-2023 › Equipment › HVAC [1]`. List filters persist in URL query params. |

**Core workflows to optimise:**
1. Support engineer triages an offline device: Dashboard → Offline devices → device → site → open incident, prefilled with site and device.
2. Ops reviews a site: Site overview with health, open incidents/WOs, offline devices, then the equipment group.
3. Create and schedule a work order from an equipment page, prefilled with site and equipment.
4. Incident lifecycle: open → comment/assign → pending → resolved (resolution required) → closed, with a timeline.
5. Find anything fast with global search across customers, sites, equipment, devices, WO# and INC#. Basic version in Milestone 3, command palette in Milestone 10.

## D. Angular architecture

- **Angular 22, standalone, zoneless** (the CLI default), `ChangeDetectionStrategy.OnPush` everywhere, strict TS, `--prefix=nx`. **CSR only, no SSR.** It's an authenticated app, so SEO is irrelevant and SSR would complicate Supabase auth sessions.
- **Data fetching:** supabase-js returns Promises, so services expose async methods. Components and stores wrap them in Angular's **`resource()`**, which gives `value()`, `isLoading()` and `error()` signals for free and fits the loading, empty and error-state requirement. `httpResource` isn't used because Supabase isn't called through `HttpClient`.
- **State:** no NgRx. Per-feature **signal stores** are plain `@Injectable` classes that hold `signal`s and `computed`s. They're provided at the route level so they reset when you leave the feature. Global state is limited to auth/session and UI (toasts).
- **List state lives in the URL** (sort, filters, page) and is read with `input()` bindings from the router (`withComponentInputBinding`). Back, refresh and deep links all work (ui-ux-pro-max `deep-linking`, `state-preservation`).
- **Forms:** typed Reactive Forms (`FormBuilder.nonNullable`). Shared `nx-form-field` wrappers handle the label, error text, `aria-describedby` and validation on blur.

### Folder structure
```
src/app/
  core/                 # app-wide singletons, no UI
    supabase/           # SUPABASE_CLIENT InjectionToken, database.types.ts (generated)
    auth/               # AuthService (signals: session, user, role), authGuard, roleGuard
    errors/             # mapSupabaseError(), global ErrorHandler
    layout/             # AppShell, Sidebar, Topbar, Breadcrumbs, DemoBanner
  shared/
    ui/                 # Button, Badge, StatusBadge, DataTable, Pagination, Drawer, Dialog,
                        # ConfirmDialog, Toast, EmptyState, Skeleton, KpiStat, Tabs, Timeline, FormField
    pipes/              # relativeTime, enumLabel
    models/             # domain types derived from database.types (Row/Insert/Update aliases)
    utils/              # query-param helpers, list-query builder
  features/
    dashboard/  customers/  sites/  equipment/  devices/  work-orders/  incidents/  analytics/  auth/
      <feature>.routes.ts
      data/<feature>.service.ts     # ONLY place Supabase queries live
      state/<feature>.store.ts      # signals/computed, when a feature needs shared state
      pages/  (list, detail, form)
      components/                   # feature-only presentational pieces
  integrations/                     # empty boundary for future AWS IoT Core / InControl adapters
src/styles/   _primitives.scss _semantic.scss _components.scss _typography.scss _reset.scss
supabase/     migrations/*.sql  seed.sql  config.toml
scripts/      generate-seed.ts (deterministic seeded faker → seed.sql)
docs/         architecture.md  decisions/ (ADRs)  rls.md  brand-guidelines.md
design-system/nexus/MASTER.md (+ pages/)
```

### Routing (all lazy via `loadChildren`/`loadComponent`)
```
/login                         public
/                              AppShell (authGuard) → redirect /dashboard
  dashboard
  customers, customers/new, customers/:id, customers/:id/edit
  sites, sites/new
  sites/:id                    SiteShell (header + tab bar), child routes:
     overview | equipment | devices | work-orders | incidents | details
  equipment, equipment/:id, equipment/:id/edit
  devices, devices/:id
  work-orders, work-orders/new, work-orders/:id
  incidents, incidents/new, incidents/:id
  analytics
  **  → NotFound
```
- Create and edit routes use `roleGuard('operator')`. The guard only improves UX. RLS is the real enforcement.
- Resolvers aren't used. Detail pages render their skeleton immediately with `resource()`. Resolvers would block navigation, which feels slower.
- Breadcrumbs come from route `data.breadcrumb` plus record names from the stores.

### Services
`CustomerService, SiteService, EquipmentService, DeviceService, TelemetryService, WorkOrderService, IncidentService, DashboardService, AnalyticsService, LookupService` (vendors, profiles for assignee pickers).

Each service follows the same shape:
- `list(query: ListQuery)` returns `{rows, total}` using `.range()` and `count: 'exact'`.
- `getById`, `create`, `update` and `remove` are fully typed from `Database`.
- Errors are normalised into an `AppError`.

Components never import `SupabaseClient`.

### Libraries (one per job)
| Need | Choice | Why |
|---|---|---|
| Backend client | `@supabase/supabase-js` | Required |
| Charts | `echarts` + `ngx-echarts` (tree-shaken `echarts/core`) | Time-series zoom, large datasets via canvas, good a11y aria support. Chart.js is weaker for zoom and dense telemetry. |
| Icons | `lucide-angular` | One consistent stroke set. The skill names Lucide as acceptable. Phosphor's Angular support is weak. |
| Dates | `date-fns` | Tree-shakeable, immutable |
| Overlays, a11y | `@angular/cdk` (overlay, a11y focus trap, scrolling) + `@angular/aria` (tabs, menu, combobox, listbox) | Accessible behaviour without imposed styles |
| Tables | **Own `nx-data-table`** on a semantic `<table>` | Server-side sort, filter and paging are simple with Supabase. CDK table adds little. Building it is a strong portfolio piece. |
| Tests | Vitest (CLI default) + CDK harnesses. Playwright for e2e (preinstalled). | Skill-recommended |

No Tailwind. You specified SCSS, and running two styling systems would conflict.

## E. Database design (Postgres 17, all PKs `uuid default gen_random_uuid()`, all tables have `created_at`, `updated_at` via trigger)

**Enums:** `customer_status`, `site_status`, `equipment_category` (hvac, cooler, freezer, make_up_air, exhaust, other), `equipment_status` (operational, degraded, down, decommissioned), `device_type` (thermostat, gateway, energy_meter, temp_sensor, humidity_sensor, controller, other), `connectivity_status` (online, offline, warning, unknown), `wo_status`, `wo_priority`, `incident_status`, `incident_severity` (sev1–sev4), `app_role` (viewer, operator, admin), `telemetry_metric`.

| Table | Key columns / FKs | Notes |
|---|---|---|
| `profiles` *(new)* | `id → auth.users`, `full_name`, `role app_role default 'viewer'` | Created by a trigger on signup. Used for assignees and RLS. |
| `customers` | name, account_number (unique), status, industry, billing_email, billing address fields, payment_terms | |
| `contacts` *(new)* | `customer_id` FK, `site_id` FK nullable, name, role, email, phone, is_primary | Normalised instead of repeating contact columns on customers and sites |
| `sites` | `customer_id` FK (cascade restrict), code (unique, e.g. `IHOP-2023`), name, address fields, timezone, status, square_footage, opened_on, lat/lng | |
| `equipment` | `site_id` FK, category, name, area_served, manufacturer, model, serial_number, install_date, warranty_until, status, specs `jsonb` (tonnage, unit type…) | `jsonb` holds category-specific specs, so there's no table per category |
| `devices` | `site_id` FK, `equipment_id` FK **nullable** (set null), device_type, external_id (unique, e.g. MAC/EUI), manufacturer, model, provider, firmware_version, connectivity_status, last_seen_at, health_score 0–100, is_simulated bool default true | `is_simulated` and `provider` mark the future integration boundary |
| `telemetry` | `device_id` FK, `recorded_at`, `metric`, `value numeric` | Long/narrow format so any device type works. Index `(device_id, metric, recorded_at desc)`. |
| `vendors` *(new)* | name, trade, phone, email | Work order contractors |
| `work_orders` | `wo_number` (identity → displayed `WO-100245`), `site_id` FK, `equipment_id` FK nullable, title, description, priority, status, `vendor_id` FK nullable, `assigned_to` → profiles nullable, scheduled_for, completed_at, `created_by` | CHECK: `completed_at` is required when status = completed |
| `incidents` | `incident_number` (identity → `INC-…`), `site_id` FK, `equipment_id` / `device_id` FK nullable, title, description, severity, status, `assigned_to`, root_cause, resolution, opened_at, resolved_at | CHECK: resolution is required when resolved or closed |
| `incident_comments` | `incident_id` FK cascade, `author_id`, body | |
| `incident_events` *(new)* | `incident_id`, type (status_change, assignment, severity_change), old/new `jsonb`, actor | Written by a trigger, so the timeline can't be faked by the client |
| `equipment_notes` | `equipment_id` FK cascade, `author_id`, body | |
| `equipment_audit_logs` | `equipment_id`, action, changed_fields `jsonb`, actor | Written by an AFTER UPDATE trigger on `equipment` |

`customer_id` is denormalised nowhere. Work orders and incidents reach the customer through `site_id`, which avoids inconsistency.

**Views** (`security_invoker = true` so RLS still applies):
- `v_site_summary`: counts per site for equipment, devices by status, open WOs and open incidents.
- `v_dashboard_kpis`
- `v_device_latest`: latest reading per metric, built with `DISTINCT ON`.

Aggregates come from the database, never from hardcoded values. RPC functions are added for analytics time-bucketing (`date_trunc`).

**Indexes:**
- Every FK.
- `(status)` on WOs, incidents and devices.
- `pg_trgm` GIN on searchable names, codes and serials for global search.

### RLS strategy
- RLS is enabled on **every** table, with no exceptions.
- `public.auth_role()` is a `security definer stable` function that reads `profiles.role` for `auth.uid()`. It returns `'viewer'` when the JWT claim `is_anonymous` is true.
- **SELECT:** `to authenticated using (true)`. That covers guests and real users, and the anon (logged-out) role gets nothing.
- **INSERT/UPDATE:** `auth_role() in ('operator','admin')`.
- **DELETE:** `auth_role() = 'admin'`.
- Comments and notes: insert is allowed when `author_id = auth.uid()` and the role is operator or above. Users can only edit their own rows.
- Audit and event tables: no client insert/update/delete. Only triggers write them, because trigger functions are `security definer`.
- Profiles: users can read all and update only their own `full_name`. Role changes happen only via SQL or admin.

**Demo access:**
- The login page has an "Explore the demo (read-only)" button that calls `supabase.auth.signInAnonymously()`, giving a viewer role. The UI shows a persistent "Demo environment · simulated data · read-only" banner.
- An `operator@nexus.demo`-style account (or yours) is created by hand for write demos.
- Anonymous sign-ins must be **enabled in the Supabase dashboard**, and CAPTCHA or rate limits are recommended. That's your action, not mine.
- Hiding buttons is UX only. The policies above are what enforce access, and they're documented in `docs/rls.md` and tested with SQL tests (`set role authenticated; set request.jwt.claims …`).

### Migrations, types, seed
- `supabase/migrations/*.sql` in the repo is the source of truth. Each migration is applied to the hosted project with the Supabase MCP `apply_migration`, or `supabase db push`, so history is recorded.
- Types come from MCP `generate_typescript_types` and are written to `core/supabase/database.types.ts`. They're regenerated after every migration.
- Seed: `scripts/generate-seed.ts` uses `@faker-js/faker` with a **fixed seed**, so re-running it is deterministic. It emits `supabase/seed.sql`, which truncates and re-inserts. Volumes: 20 customers, 50 sites, about 260 equipment records, about 280 devices (around 70% linked to equipment), 120 WOs, 60 incidents with comments.
- Telemetry is generated **in SQL** with `generate_series`: about 60 devices × 3–4 metrics × hourly for 30 days, roughly 150k rows, which fits the free tier. Values follow believable diurnal curves rather than random noise.
- **All timestamps are relative to `now()`** so the demo never looks stale. A `simulate_tick()` function run by `pg_cron` every 15 minutes appends readings and flips a few connectivity statuses (Milestone 6).

**Integration readiness:**
- `devices.provider` and `is_simulated` mark where data comes from.
- `src/app/integrations/` holds a `DeviceDataProvider` interface, with only `SupabaseSimulatedProvider` implemented.
- A future AWS IoT or InControl ingest would write into `telemetry` server-side (an Edge Function), and the Angular app wouldn't change. No custom backend now.

## F. UX and design direction

**Visual:**
- **Swiss/minimal enterprise style**, light theme, high density (ui-ux-pro-max density 8).
- Neutral slate surfaces with 1px borders instead of heavy shadows, a 6px radius (not pill-shaped cards), and one accent colour.

**Tokens (three layers per the design-system skill):**
- Primitives: slate scale, indigo `#3B5BDB` accent, green/amber/red/slate for status.
- Semantic tokens: `--surface`, `--text-muted`, `--status-online` and so on.
- Component tokens: `--table-row-h: 36px`, compact 32px, comfortable 44px.
- Spacing on a 4px scale. Type scale 12/13/14/16/20/24. Body text 14px (dense desktop app). Tabular numbers in data columns.

**Status system:** every status renders as a badge with a dot, icon and text, and never relies on colour alone. One `StatusBadge` component maps all enums.

**Shell:**
- A left sidebar (collapsible to an icon rail) with groups. **Overview:** Dashboard, Analytics. **Accounts:** Customers, Sites. **Assets:** Equipment, Devices. **Operations:** Work Orders, Incidents.
- A top bar with breadcrumbs, global search, the demo badge and a user menu.
- Below 1024px the sidebar becomes a drawer. Tables reflow into a stacked-row layout on mobile with no horizontal page scroll. Mobile is supported but desktop is the primary target.

**Page pattern used by every module:**
1. Page header: title, count, one primary action.
2. A slim KPI strip where it adds value.
3. A filter bar: search, chips, "Columns" menu, saved quick views.
4. The data table.
5. Click a row to open the detail page.
6. Quick preview opens in a **drawer** for WOs and incidents, so triage happens without losing the list.

**Customers → Sites:**
- Customer detail: header (status, account #, primary contact), a sites table with a per-site health column from `v_site_summary`, contacts, billing.
- Site detail = **SiteShell**: a persistent header (code, customer link, address, status, health chips: "3 offline devices · 2 open incidents · 1 overdue WO") plus tabs as **child routes**. Switching sections never goes back to the directory, which fixes FSG's biggest pain.

**Equipment overview:**
- Cross-site or within a site.
- Grouped table: group header shows "HVAC · 18 units · 2 down", is collapsible, and remembers its collapsed state per user in localStorage.
- Category filter chips, status filter, column presets per category, a linked-devices count with connectivity dots.

**Equipment detail:**
- Header: name, category, status, site breadcrumb, and actions (Add note, Create WO, Open incident).
- Overview tab: specs grid, a linked devices list, and a monitoring card when a thermostat is linked.
- Activity tab: unified timeline with filters (Notes / Changes / Service).
- Work Orders and Incidents tabs.

**Devices:**
- Inventory with connectivity KPIs (online/offline/warning/unknown counts double as filters), last-seen shown as relative time with a stale highlight, firmware, health.
- Device detail: identity, location (site → equipment), status history, telemetry chart (24h/7d/30d, ECharts dataZoom, an accessible table fallback and a text summary), and a "Simulated data" tag.

**Work orders:**
- Quick views: Active, Overdue (`scheduled_for < now and not completed`), Due in 7 days, Completed.
- Status transitions are enforced in UI and DB: open→scheduled→in_progress→completed, with cancelled allowed from any non-final state.
- Create from the global page or prefilled from a site or equipment page.

**Incidents:**
- Severity-first list.
- Detail: a two-column layout. The left column holds the description and the timeline (comments interleaved with trigger-written events). The right column holds a properties panel (status, severity, assignee, linked site/equipment/device, root cause).
- Resolving requires root cause and resolution. Comments use an inline composer.

**Dashboard:** answers "what needs attention now?"
- Compact KPIs.
- Offline/warning devices list.
- Overdue WOs, sev1–2 open incidents.
- 30-day connectivity trend (line), WOs created vs completed (bar).

**Analytics:** each chart is tied to a question, for example:
- "Are devices getting less reliable?" → offline-rate trend.
- "Which categories fail most?" → incidents by equipment category (bar).
- "Are we keeping up?" → WO completion rate and median time-to-resolve.
- "Where's the load?" → sites per customer.

Donuts only appear for 4 or fewer categories, per the skill's `no-pie-overuse` rule.

**States:** skeletons matched to layout (no spinners for list loads), empty states with an action, error states with retry, toasts with `aria-live="polite"`, a confirm dialog for destructive actions, and a loading spinner inside the submit button while it's disabled.

## G. Risks and open considerations

1. **Reactive Forms vs the skill:** this is a conscious trade-off for employability. Mitigation: typed non-nullable forms, and bridging to signals with `toSignal(form.valueChanges)` where computed UI needs it. An ADR documents the decision.
2. **Anonymous auth abuse:** guests could create many anonymous users. Enable CAPTCHA or rate limits, and add a cleanup cron for old anonymous users (Milestone 10).
3. **The client-only security model:** all business rules (status transitions, required resolution) must also exist as DB CHECKs or triggers, not just in Angular.
4. **Telemetry growth:** `pg_cron` ticks add about 6k rows/day. Add a retention job that keeps 60 days. Charts query bucketed aggregates through RPC, not raw rows.
5. **Counting cost:** `count: 'exact'` is fine at this data size. Switch to `estimated` past roughly 100k rows.
6. **Generated types drift:** regenerate after every migration, and fail the build if they're stale (a script check).
7. **Free-tier pausing:** Supabase free projects pause after about 7 days of inactivity. Note this in the README, and/or keep it active with the cron.
8. **Scope:** billing, utilities, EMO contracts, quotes, vendor invoices, demand response, preventive-maintenance schedules and site savings are **out of scope**, even though they appear in FSG.
9. **Postponed:** real integrations, Supabase Realtime subscriptions (optional in Milestone 6), command palette (Milestone 10), file attachments/photos, Kanban board view, customer portal/multi-tenant isolation, i18n, dark mode, SSR.

**Open questions for later (not blocking):**
- Deployment target. I recommend Netlify or Vercel static hosting in Milestone 10.
- Whether you want your own operator account email.

## H. Roadmap (each milestone = a reviewable PR-sized unit with ng build + tests green)

The sequence is refined from your draft. Milestone 2 is split because foundation and database are each large enough to review separately.

| # | Delivers | Exit criteria | Angular concepts taught (skill refs loaded) |
|---|---|---|---|
| **1** | This plan | Your approval | n/a |
| **2a Foundation** | `ng new`. Tokens (`_primitives/_semantic/_components.scss`). `MASTER.md` persisted. AppShell, sidebar, topbar, breadcrumbs, routing skeleton with lazy placeholders. Shared UI v1 (Button, Badge, StatusBadge, EmptyState, Skeleton, Toast, Dialog). Supabase client token and env config. Login page plus guest sign-in. Guards. README and architecture doc v1. | Builds. Login works against the hosted project. `validate-tokens` is clean. Vitest smoke tests pass. | Standalone components, `inject()`, `InjectionToken`, providers, routes and lazy loading, guards, signals/computed, control flow (`cli.md`, `components.md`, `define-routes.md`, `loading-strategies.md`, `route-guards.md`, `di-fundamentals.md`, `defining-providers.md`, `environment-configuration.md`) |
| **2b Database** | All migrations: enums, tables, triggers, views, RLS, `auth_role()`. Seed generator plus `seed.sql`. SQL RLS tests. Generated types. `docs/rls.md`. | Guest can read but every write is denied. Operator can write. Row counts match targets. | Mostly SQL. On the Angular side: typed `Database` generics. |
| **3 Customers and Sites** | `nx-data-table` with server sort, filter and pagination plus URL state. Customers list, detail and form. Sites list and SiteShell (overview and details tabs). Contacts. Basic global search. | CRUD works end to end. Back and refresh preserve filters. | `resource()`, router `input()` binding, typed Reactive Forms, `input()`/`output()`, content projection (`resource.md`, `reactive-forms.md`, `inputs.md`, `outputs.md`, `queries-and-projection.md`) |
| **4 Equipment** | Grouped equipment overview (global and site tab). Equipment detail with Activity timeline, notes, audit (via trigger). Create and edit. | Audit entries appear after an edit, without any client writes. | `linkedSignal`, `computed`-derived grouping, `@defer` for heavy tabs, `@angular/aria` tabs/menus (`linked-signal.md`, `deferrable-views.md`, `angular-aria.md`) |
| **5 Devices** | Inventory with connectivity KPIs and filters. Device detail. Link and unlink to equipment. Site Devices tab. | Status filter counts match the DB view. | Pipes, `effect` and when NOT to use it, CDK overlay drawer (`pipes.md`, `effects.md`) |
| **6 Telemetry** | `TelemetryService` via RPC buckets. ECharts wrapper component. Thermostat state card. Range switch. `simulate_tick()` plus `pg_cron`. | Charts are driven only by DB rows. Stale data is shown as stale. | Third-party lib integration, `afterRenderEffect`, `DestroyRef` cleanup |
| **7 Work orders** | List with quick views, drawer preview, detail, create/edit with prefill, status transitions (UI + DB). | Overdue logic is correct. Invalid transitions are rejected by the DB. | Cross-field validators, custom form controls (ControlValueAccessor) |
| **8 Incidents** | List, detail with timeline (comments + trigger events), create with optional equipment/device, resolution rules. | Timeline is ordered and complete. RLS blocks editing other users' comments. | Component composition, optimistic updates and rollback |
| **9 Dashboard and Analytics** | KPI and attention widgets, analytics charts (each with a question title, a table fallback and a text summary). | Every number traces to a view or RPC. | Parallel resources, `computed` derivations, performance |
| **10 Refinement** | A11y pass (ui-ux-pro-max §1–§3), responsive pass, command palette, Playwright e2e for the 5 core workflows, deploy, README polish, banner. | Lighthouse a11y ≥ 95. e2e passes. Live URL. | Harnesses, router testing, e2e (`component-harnesses.md`, `router-testing.md`, `e2e-testing.md`) |

Each milestone ends with a recap of what was built, the concepts covered and how they work, what to understand before moving on, and 3–5 check questions. I don't start the next milestone until you say so.

## Verification (applies from Milestone 2 onward)
- `npx ng build` after every change, as the angular-developer skill requires. `npx ng test` (Vitest).
- `node .claude/skills/design-system/scripts/validate-tokens.cjs --dir src/` must find no hardcoded colours.
- RLS: SQL test scripts check the anon, guest and operator roles. Plus a manual guest-session check that writes fail with 42501 in the UI and show a "read-only" toast.
- Supabase MCP `get_advisors` (security and performance) after each migration must return no RLS warnings.
- Playwright (preinstalled Chromium) screenshots at 375 / 768 / 1440 for each UI milestone, plus e2e flows in Milestone 10.

## Notes
- Project memory: I'll add `CLAUDE.md` with these decisions (and a memory entry) as the first step of Milestone 2a. Plan mode blocks writes now.
- Your actions before Milestone 2a: enable **Anonymous sign-ins** (Auth → Providers) in the Supabase "Nexus" project, and confirm I may run migrations against it through the MCP.
