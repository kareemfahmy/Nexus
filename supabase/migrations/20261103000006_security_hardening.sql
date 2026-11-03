-- Nexus 0006: security hardening (from Supabase security advisors)
--
-- Postgres grants EXECUTE on new functions to PUBLIC by default, so revoking from `anon` alone
-- (0003) left the role helpers callable by logged-out clients via /rest/v1/rpc/*.
-- RLS policies only target `authenticated`, so anon never needs these functions.
revoke execute on function
  public.auth_role(), public.current_member_id(), public.can_write(), public.is_admin(), public.is_seeding()
  from public, anon;
grant execute on function
  public.auth_role(), public.current_member_id(), public.can_write(), public.is_admin(), public.is_seeding()
  to authenticated;

-- Accepted advisor findings (documented in docs/rls.md):
--  * authenticated_security_definer_function_executable: auth_role() / current_member_id() only
--    reveal the CALLER's own role and team-member id; policies need them.
--  * auth_allow_anonymous_sign_ins: intentional read-only guest demo access.

-- Backfill: accounts created before the signup trigger existed get a profile + team member.
insert into public.profiles (id)
select u.id from auth.users u
where not coalesce(u.is_anonymous, false)
on conflict (id) do nothing;

insert into public.team_members (user_id, full_name, email, team)
select u.id,
       coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), split_part(u.email, '@', 1), 'New user'),
       u.email,
       'support'
from auth.users u
where not coalesce(u.is_anonymous, false)
on conflict (user_id) do nothing;
