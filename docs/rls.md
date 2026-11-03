# Nexus security model (Row Level Security)

Nexus is a browser app talking directly to Supabase's auto-generated REST API (PostgREST).
Anyone can read the publishable key from the page source, so **the database itself decides who
may read or write each row**. Hiding buttons in Angular is UX only.

## Callers and what they can do

| Caller | How they get in | Read | Create / update | Delete |
|---|---|---|---|---|
| **anon** | No session (logged out) | Nothing | Nothing | Nothing |
| **guest** | "Explore the demo", Supabase anonymous sign-in | Everything | Nothing | Nothing |
| **viewer** | Real account (default role on signup) | Everything | Nothing | Nothing |
| **operator** | Real account promoted by an admin | Everything | Customers, sites, contacts, vendors, equipment, devices, work orders, incidents; notes and comments **as themselves** | Nothing |
| **admin** | Real account promoted by an admin | Everything | Everything an operator can, plus team directory | Yes |

Nobody, including admins, can write through the API to:
- `telemetry`, which is written by the simulator and future ingestion
- `incident_events` and `equipment_audit_logs`, which are written only by triggers so history can't be forged
- `profiles.role`, which is changed only with SQL

## How it works

1. **RLS is enabled on every table** (migration 0003). With RLS on and no matching policy, Postgres returns zero rows and rejects writes.
2. **`public.auth_role()`** returns the caller's role:
   - anonymous JWT (`is_anonymous = true`) → always `viewer`
   - otherwise → `profiles.role` for `auth.uid()`, defaulting to `viewer`

   It is `SECURITY DEFINER` so it can read `profiles` regardless of RLS, and has `search_path = ''` to prevent search-path hijacking.
3. **Policies** use `(select public.can_write())` and `(select public.is_admin())`. The `(select …)` wrapper makes Postgres evaluate the function once per query instead of once per row.
4. **Notes and comments** require `author_id = public.current_member_id()`, so you can't post as someone else.
5. **Signup trigger** (`handle_new_user`): every new non-anonymous user gets a `profiles` row (role `viewer`) and a `team_members` row. Promotion is manual.
6. **Business rules live in triggers** (migration 0004), so the API can't bypass them:
   - work order status workflow (completed and cancelled are final)
   - an incident needs a root cause and resolution before it can be resolved or closed
   - `completed_at` / `resolved_at` are maintained automatically
   - incident timeline events and the equipment audit trail are written with the acting team member

## Promoting a user

After someone signs up (or you create a user in the Supabase dashboard under Authentication → Users), run this in the SQL editor:

```sql
update public.profiles
set role = 'operator'   -- or 'admin'
where id = (select id from auth.users where email = 'person@example.com');
```

The new role applies the next time the app loads their session.

## Tests

`supabase/tests/rls_and_rules.test.sql` simulates each caller exactly as PostgREST does (`SET ROLE` plus `request.jwt.claims`) and asserts 25 behaviours. It runs inside one `DO` block that ends by raising `RLS_TESTS_PASSED: 25 checks`, which rolls back every test write. That makes it safe to run against the hosted demo database.

```bash
psql "$DATABASE_URL" -f supabase/tests/rls_and_rules.test.sql
```

Expected output: `ERROR: RLS_TESTS_PASSED: 25 checks`. A failure reads `RLS_TEST_FAILED: <what broke>`.

## Supabase advisor findings we accept

| Finding | Why it's acceptable |
|---|---|
| `auth_allow_anonymous_sign_ins` on every table | Intentional: the read-only guest demo. Guests are forced to `viewer` in `auth_role()`. |
| `authenticated_security_definer_function_executable` for `auth_role()` and `current_member_id()` | They only return the caller's **own** role and team-member id. Policies need them. |
| Unused indexes | The database is new. These are foreign-key and filter indexes the app will use from Milestone 3. |

Recommended dashboard settings (owner action):
- **Authentication → Attack Protection:** enable CAPTCHA once the login form sends a token (Milestone 10), and keep rate limits on anonymous sign-ins.
- **Leaked password protection:** enable it if your plan supports it.
