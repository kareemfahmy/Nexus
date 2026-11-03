-- =============================================================================
-- Nexus security and business-rule tests.
--
-- Simulates each kind of caller the way PostgREST does (SET ROLE + request.jwt.claims)
-- and asserts what it can and cannot do. Runs as ONE DO block that always ends by raising
-- an exception, so every test write is rolled back, even on the hosted database.
--
--   Success: ERROR  RLS_TESTS_PASSED: <n> checks
--   Failure: ERROR  RLS_TEST_FAILED: <what broke>
--
-- Requires seeded data (supabase/seed.sql). Run with psql -f, the SQL editor, or MCP execute_sql.
-- =============================================================================
do $tests$
declare
  checks int := 0;
  n bigint;
  viewer_id uuid := gen_random_uuid();
  operator_id uuid := gen_random_uuid();
  admin_id uuid := gen_random_uuid();
  guest_id uuid := gen_random_uuid();
  operator_member uuid;
  other_member uuid;
  site uuid;
  cust uuid;
  wo uuid;
  inc uuid;
  eq uuid;
  dev uuid;
  failed boolean;
begin
  -- ---------- Fixtures (as postgres) ----------
  insert into auth.users (id, email, is_anonymous, raw_user_meta_data) values
    (viewer_id, 'viewer@test.example', false, '{"full_name":"Test Viewer"}'),
    (operator_id, 'operator@test.example', false, '{"full_name":"Test Operator"}'),
    (admin_id, 'admin@test.example', false, '{"full_name":"Test Admin"}'),
    (guest_id, null, true, '{}');
  update public.profiles set role = 'operator' where id = operator_id;
  update public.profiles set role = 'admin' where id = admin_id;

  select count(*) into n from public.profiles where id in (viewer_id, operator_id, admin_id, guest_id);
  if n <> 3 then raise exception 'RLS_TEST_FAILED: signup trigger should create 3 profiles (not for the guest), got %', n; end if;
  checks := checks + 1;

  select id into operator_member from public.team_members where user_id = operator_id;
  select id into other_member from public.team_members where user_id is null limit 1;
  if operator_member is null then raise exception 'RLS_TEST_FAILED: signup trigger did not create a team member'; end if;
  checks := checks + 1;

  select id into site from public.sites limit 1;
  select id into cust from public.customers limit 1;
  select id into eq from public.equipment where status = 'operational' limit 1;
  select id into dev from public.devices limit 1;
  select id into wo from public.work_orders where status = 'completed' limit 1;
  select id into inc from public.incidents where status = 'open' limit 1;

  -- ---------- anon (logged out): sees nothing ----------
  execute 'set local role anon';
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  select count(*) into n from public.customers;
  if n <> 0 then raise exception 'RLS_TEST_FAILED: anon can read % customers', n; end if;
  select count(*) into n from public.telemetry;
  if n <> 0 then raise exception 'RLS_TEST_FAILED: anon can read telemetry'; end if;
  checks := checks + 2;

  -- ---------- guest (anonymous sign-in): read-only ----------
  execute 'reset role';
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', guest_id, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  if public.auth_role() <> 'viewer' then raise exception 'RLS_TEST_FAILED: guest role is %', public.auth_role(); end if;
  select count(*) into n from public.sites;
  if n = 0 then raise exception 'RLS_TEST_FAILED: guest cannot read sites'; end if;
  checks := checks + 2;

  failed := false;
  begin
    insert into public.customers (name, account_number) values ('Guest Co', 'ACC-GUEST');
  exception when insufficient_privilege then failed := true;
  end;
  if not failed then raise exception 'RLS_TEST_FAILED: guest inserted a customer'; end if;
  checks := checks + 1;

  update public.sites set name = 'hacked' where id = site;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'RLS_TEST_FAILED: guest updated a site'; end if;
  delete from public.devices where id = dev;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'RLS_TEST_FAILED: guest deleted a device'; end if;
  checks := checks + 2;

  -- ---------- viewer (real account, default role): read-only ----------
  perform set_config('request.jwt.claims', json_build_object('sub', viewer_id, 'role', 'authenticated')::text, true);
  if public.auth_role() <> 'viewer' then raise exception 'RLS_TEST_FAILED: new user role is %', public.auth_role(); end if;
  update public.work_orders set title = 'viewer edit' where id = wo;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'RLS_TEST_FAILED: viewer updated a work order'; end if;
  -- cannot promote themselves
  update public.profiles set role = 'admin' where id = viewer_id;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'RLS_TEST_FAILED: viewer changed their own role'; end if;
  checks := checks + 3;

  -- ---------- operator: writes operational data, cannot delete ----------
  perform set_config('request.jwt.claims', json_build_object('sub', operator_id, 'role', 'authenticated')::text, true);
  if public.auth_role() <> 'operator' then raise exception 'RLS_TEST_FAILED: operator role is %', public.auth_role(); end if;
  insert into public.customers (name, account_number) values ('Operator Co', 'ACC-OPERATOR');
  update public.equipment set area_served = 'Test area' where id = eq;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'RLS_TEST_FAILED: operator could not update equipment'; end if;
  checks := checks + 2;

  delete from public.customers where account_number = 'ACC-OPERATOR';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'RLS_TEST_FAILED: operator deleted a customer'; end if;
  checks := checks + 1;

  -- Trigger-owned tables are not writable by clients
  failed := false;
  begin
    insert into public.telemetry (device_id, recorded_at, metric, value) values (dev, now(), 'power_kw', 1);
  exception when insufficient_privilege then failed := true;
  end;
  if not failed then raise exception 'RLS_TEST_FAILED: operator wrote telemetry'; end if;
  failed := false;
  begin
    insert into public.incident_events (incident_id, event_type) values (inc, 'created');
  exception when insufficient_privilege then failed := true;
  end;
  if not failed then raise exception 'RLS_TEST_FAILED: operator forged an incident event'; end if;
  checks := checks + 2;

  -- Comments: only as yourself
  insert into public.incident_comments (incident_id, author_id, body) values (inc, operator_member, 'Operator comment');
  failed := false;
  begin
    insert into public.incident_comments (incident_id, author_id, body) values (inc, other_member, 'Impersonated comment');
  exception when insufficient_privilege then failed := true;
  end;
  if not failed then raise exception 'RLS_TEST_FAILED: operator commented as someone else'; end if;
  checks := checks + 2;

  -- ---------- business rules ----------
  -- Audit trail written by trigger, attributed to the operator
  select count(*) into n from public.equipment_audit_logs
   where equipment_id = eq and action = 'updated' and actor_id = operator_member and changed_fields ? 'area_served';
  if n <> 1 then raise exception 'RLS_TEST_FAILED: equipment update produced % audit rows', n; end if;
  checks := checks + 1;

  -- Completed work orders are final
  failed := false;
  begin
    update public.work_orders set status = 'open' where id = wo;
  exception when check_violation then failed := true;
  end;
  if not failed then raise exception 'RLS_TEST_FAILED: completed work order was re-opened'; end if;
  checks := checks + 1;

  -- open -> completed skips the workflow
  update public.work_orders set status = 'open' where id = (select id from public.work_orders where status = 'scheduled' limit 1);
  failed := false;
  begin
    update public.work_orders set status = 'completed'
     where id = (select id from public.work_orders where status = 'open' limit 1);
  exception when check_violation then failed := true;
  end;
  if not failed then raise exception 'RLS_TEST_FAILED: work order jumped from open to completed'; end if;
  checks := checks + 1;

  -- Resolving an incident requires root cause + resolution
  failed := false;
  begin
    update public.incidents set status = 'resolved' where id = inc;
  exception when check_violation then failed := true;
  end;
  if not failed then raise exception 'RLS_TEST_FAILED: incident resolved without a resolution'; end if;
  checks := checks + 1;

  -- Status changes are recorded in the incident timeline with the actor
  update public.incidents set status = 'in_progress' where id = inc;
  select count(*) into n from public.incident_events
   where incident_id = inc and event_type = 'status_change' and actor_id = operator_member;
  if n <> 1 then raise exception 'RLS_TEST_FAILED: status change produced % events', n; end if;
  checks := checks + 1;

  -- ---------- admin: may delete ----------
  perform set_config('request.jwt.claims', json_build_object('sub', admin_id, 'role', 'authenticated')::text, true);
  delete from public.customers where account_number = 'ACC-OPERATOR';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'RLS_TEST_FAILED: admin could not delete a customer'; end if;
  checks := checks + 1;

  execute 'reset role';
  -- Always roll back everything above.
  raise exception 'RLS_TESTS_PASSED: % checks', checks;
end;
$tests$;
