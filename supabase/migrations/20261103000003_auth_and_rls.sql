-- Nexus 0003: roles, signup trigger and Row Level Security
--
-- Access model (see docs/rls.md):
--   anon (logged out)       -> nothing
--   guest (anonymous user)  -> read everything, write nothing
--   viewer                  -> read everything, write nothing
--   operator                -> read + create/update operational records, own notes/comments
--   admin                   -> operator + delete

-- Current user's role. SECURITY DEFINER so it can read profiles regardless of RLS.
-- Anonymous (guest) sessions are ALWAYS viewers, even if a profile row were somehow present.
create function public.auth_role() returns public.app_role
language sql stable security definer set search_path = '' as $$
  select case
    when coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then 'viewer'::public.app_role
    else coalesce(
      (select p.role from public.profiles p where p.id = (select auth.uid())),
      'viewer'::public.app_role
    )
  end;
$$;

-- team_members.id of the current user (null for guests and logged-out users).
create function public.current_member_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select tm.id from public.team_members tm where tm.user_id = (select auth.uid());
$$;

create function public.can_write() returns boolean
language sql stable set search_path = '' as $$
  select public.auth_role() in ('operator', 'admin');
$$;

create function public.is_admin() returns boolean
language sql stable set search_path = '' as $$
  select public.auth_role() = 'admin';
$$;

revoke execute on function public.auth_role(), public.current_member_id(), public.can_write(), public.is_admin()
  from anon;

-- New non-anonymous auth user -> profile (viewer) + team member directory entry.
-- Promotion to operator/admin is a deliberate manual step (SQL / admin), never self-service.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(new.is_anonymous, false) then
    return new;
  end if;

  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;

  insert into public.team_members (user_id, full_name, email, team)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1), 'New user'),
    new.email,
    'support'
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Enable RLS everywhere --------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'team_members', 'vendors', 'customers', 'sites', 'contacts', 'equipment', 'devices',
    'telemetry', 'work_orders', 'incidents', 'incident_comments', 'incident_events',
    'equipment_notes', 'equipment_audit_logs'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    -- Every signed-in session (including guests) may read.
    execute format(
      'create policy "authenticated can read" on public.%I for select to authenticated using (true)', t
    );
  end loop;
end;
$$;

-- Operational records: operators write, admins delete ------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'vendors', 'customers', 'sites', 'contacts', 'equipment', 'devices', 'work_orders', 'incidents'
  ] loop
    execute format(
      'create policy "operators can insert" on public.%I for insert to authenticated with check ((select public.can_write()))', t
    );
    execute format(
      'create policy "operators can update" on public.%I for update to authenticated using ((select public.can_write())) with check ((select public.can_write()))', t
    );
    execute format(
      'create policy "admins can delete" on public.%I for delete to authenticated using ((select public.is_admin()))', t
    );
  end loop;
end;
$$;

-- Team directory: admins manage it.
create policy "admins can insert" on public.team_members
  for insert to authenticated with check ((select public.is_admin()));
create policy "admins can update" on public.team_members
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins can delete" on public.team_members
  for delete to authenticated using ((select public.is_admin()));

-- profiles: read-only from the client. Roles change only through SQL by an administrator.

-- Notes & comments: operators add them as themselves; authors edit their own; admins delete.
do $$
declare t text;
begin
  foreach t in array array['incident_comments', 'equipment_notes'] loop
    execute format(
      'create policy "operators add as themselves" on public.%I for insert to authenticated
         with check ((select public.can_write()) and author_id = (select public.current_member_id()))', t
    );
    execute format(
      'create policy "authors edit their own" on public.%I for update to authenticated
         using ((select public.can_write()) and author_id = (select public.current_member_id()))
         with check ((select public.can_write()) and author_id = (select public.current_member_id()))', t
    );
    execute format(
      'create policy "admins can delete" on public.%I for delete to authenticated using ((select public.is_admin()))', t
    );
  end loop;
end;
$$;

-- telemetry, incident_events, equipment_audit_logs: no client write policies at all.
-- Telemetry is written by the simulator / future ingest; events and audit logs by triggers.
