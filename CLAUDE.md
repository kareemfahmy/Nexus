# Nexus: project memory

Portfolio-grade Angular + Supabase facility and IoT operations platform. It's inspired by Facility Smart Grid (FSG) but redesigned from scratch.
The full approved plan is in `docs/architecture-plan.md`. Read it before starting any milestone.

## Approved decisions (Milestone 1)
- Angular 22 (latest stable), standalone, zoneless, OnPush, strict TS, selector prefix `nx`, SCSS, CSR only (no SSR).
- Forms: **Reactive Forms** (typed, `nonNullable`). This is a deliberate deviation from the angular-developer skill's Signal Forms default.
- UI layer: **custom SCSS design tokens** (primitive → semantic → component) + `@angular/cdk` + `@angular/aria`. No Tailwind, no Material or PrimeNG.
- Theme: **light only**. Tokens are layered so dark mode can be added later.
- Fonts: IBM Plex Sans (UI) + IBM Plex Mono (IDs and numbers). This overrides ui-ux-pro-max's Fira suggestion.
- Libraries: `@supabase/supabase-js`, `echarts` + `ngx-echarts`, `lucide-angular`, `date-fns`. There's one library per job, so don't add duplicates.
- Data access: Supabase queries live ONLY in `features/*/data/*.service.ts`. Components and stores use `resource()`. Per-feature signal stores are used, with no NgRx.
- List state (sort, filter, page) lives in URL query params.
- Demo access: guest "Explore demo" button uses Supabase anonymous sign-in, which gives the viewer role (read-only). Real accounts get the operator or admin role.
- Security is RLS on every table, via `public.auth_role()`. UI guards only improve UX and aren't the enforcement layer.

## Supabase
- Hosted project "Nexus": ref `csblzgxsskyfpgsevlgd`, eu-central-1, Postgres 17.
- Migrations in `supabase/migrations/` are the source of truth. They're applied via the Supabase MCP `apply_migration`.
- Regenerate `src/app/core/supabase/database.types.ts` after every migration.
- Only the publishable key goes in frontend env files. Never put the service-role key there.

## Skills to use
- angular-new-app (init and `ng generate`) and angular-developer (standards, `ng build` after every change).
- ui-ux-pro-max (design QA, `design-system/nexus/MASTER.md`), design-system (tokens, `validate-tokens.cjs`), brand (voice and microcopy).
- ui-styling is React/shadcn, so use its principles only. banner-design and slides are for Milestone 10 portfolio assets.

## Working agreement
- Build incrementally, one milestone at a time. Explain the plan before each milestone. Stop for review after each one.
- End each milestone with: what was implemented, the Angular concepts covered, how it works, what to understand before moving on, and 3–5 check questions.
- The user is learning Angular, so explain the key decisions concisely.
- Style: direct, no em dashes, honest critique.

## Status
- [x] M1 Planning (approved)
- [ ] M2a Foundation: blocked at `ng new` because the sandbox denied running external `npx @angular/cli`. Waiting on user permission.
- [ ] M2b Database
- [ ] M3–M10 (see plan)
