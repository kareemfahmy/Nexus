# Nexus architecture

This is the living document. It's updated at the end of each milestone. The original approved plan is in `architecture-plan.md`.

## 1. How a request reaches the screen

```
Browser
  └─ main.ts → bootstrapApplication(App, appConfig)
       └─ appConfig providers
            ├─ provideRouter(routes, withComponentInputBinding, …)
            └─ provideAppInitializer → AuthService.init()  (restores the Supabase session first)

Router
  /login               → LoginPage (guestOnlyGuard)
  /  (authGuard)       → AppShell  = Sidebar + Topbar + <router-outlet>
       /customers …    → lazy feature routes  (features/<name>/<name>.routes.ts)

Feature page ──inject()──► Feature data service ──inject(SUPABASE_CLIENT)──► supabase-js ──HTTPS──► PostgREST ──► Postgres (RLS)
     ▲                              │
     └──── resource() signals ◄─────┘   value() / isLoading() / error()
```

Rules:
- **Components never touch Supabase.** Only `features/*/data/*.service.ts` (and `AuthService`) inject `SUPABASE_CLIENT`.
- **Security is in Postgres.** Guards and hidden buttons only improve UX. RLS decides what each role can read and write.

## 2. Folder responsibilities

| Folder | Contains | Must not contain |
|---|---|---|
| `core/` | Singletons used once: Supabase token, AuthService, guards, app shell layout | Feature-specific UI |
| `shared/ui/` | Presentational, reusable components with no data access | Supabase calls, feature knowledge |
| `features/<x>/` | Routes, pages, feature components, data service, optional signal store | Code imported by other features (promote it to `shared/` instead) |
| `integrations/` *(later)* | Provider adapters for AWS IoT Core / InControl | Anything the core app depends on |

## 3. Key decisions

| Decision | Why |
|---|---|
| **Standalone + zoneless + OnPush (v22 defaults)** | Change detection is driven by signals, so there's no zone.js patching. Templates only re-render when a signal they read changes. |
| **`SUPABASE_CLIENT` InjectionToken with a factory** | One client per app (one auth session). Easy to fake in tests with `{ provide: SUPABASE_CLIENT, useValue: fake }`. Lazy creation. |
| **`provideAppInitializer(() => auth.init())`** | The stored session is read before the first navigation, so a signed-in user never flashes the login page. |
| **Functional guards (`CanActivateFn`)** | Plain functions using `inject()`. `roleGuard('operator')` is a factory, so one guard serves every role. |
| **`withComponentInputBinding()`** | Route params, query params and `data` arrive as component `input()`s, so there's no `ActivatedRoute` boilerplate. Used for `returnUrl` on login and placeholder pages. |
| **Lazy feature routes** | Each module is its own chunk (see the `ng build` output), keeping the initial bundle small. |
| **Reactive Forms (not Signal Forms)** | See [ADR-001](decisions/001-reactive-forms.md). |
| **Custom SCSS tokens, no component library** | Three layers (primitive → semantic → component) let density or a dark theme change in one place. `validate-tokens.cjs` enforces "no raw values in components". |
| **`@lucide/angular` (not `lucide-angular`)** | The old package's peer range stops at Angular 21. The official successor is signal-based and zoneless. Icons are registered in `shared/ui/icon.ts` so only used icons ship. |
| **Light theme only** | Approved scope decision. Semantic tokens make dark mode a later remap of `_semantic.scss`. |

## 4. Auth and demo access

- **Explore the demo** calls `supabase.auth.signInAnonymously()`. The anonymous user gets the **viewer** role and can read everything. Every write is rejected by RLS (Milestone 2b).
- **Email/password** accounts get a role from `public.profiles` (viewer / operator / admin), wired up in 2b.
- `AuthService` exposes `session`, `user`, `isGuest`, `role` and `canWrite` as signals, all derived with `computed()` from a single `session` signal.

## 5. Design system

- Tokens: `src/styles/_primitives.scss`, `_semantic.scss`, `_components.scss`. The rules and contrast ratios are in `design-system/nexus/MASTER.md`.
- Shared components so far: `Button` (attribute component on a native `<button>`/`<a>`), `Badge`, `StatusBadge` (one map for every status enum), `Icon`, `EmptyState`, `Skeleton`, `PageHeader`, `ToastService` + `ToastContainer`, `ConfirmService` (CDK Dialog).
- Accessibility built in so far:
  - skip link
  - `aria-current` on the active nav item and breadcrumb
  - the drawer is `inert` when closed
  - visible focus rings
  - `aria-live` toasts
  - labelled inputs with linked error text
  - reduced-motion support

## 6. Verification checklist (every milestone)

```bash
npx ng build
```

```bash
npx ng test --watch=false
```

```bash
node .claude/skills/design-system/scripts/validate-tokens.cjs --dir src/app
```

Also take Playwright screenshots at 375 / 768 / 1440 and check for horizontal scroll and keyboard order.
