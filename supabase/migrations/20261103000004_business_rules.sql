-- Nexus 0004: business rules enforced in the database
-- The UI enforces the same rules for good UX, but these triggers are the guarantee:
-- a crafted API request cannot skip a workflow step or forge history.
--
-- Seed scripts set `nexus.seeding = on` to insert historical records with their own
-- timestamps. Client requests (PostgREST) cannot set this setting.

create function public.is_seeding() returns boolean
language sql stable set search_path = '' as $$
  select coalesce(current_setting('nexus.seeding', true), '') = 'on';
$$;

-- Work orders ------------------------------------------------------------------
-- Allowed status flow:
--   open -> scheduled | in_progress | cancelled
--   scheduled -> open | in_progress | cancelled
--   in_progress -> scheduled | completed | cancelled
--   completed, cancelled -> (final)
create function public.work_orders_enforce_status() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status and not public.is_seeding() then
    if old.status in ('completed', 'cancelled') then
      raise exception 'Work order % is % and can no longer change status', old.display_id, old.status
        using errcode = 'check_violation';
    end if;
    if not (
      (old.status = 'open' and new.status in ('scheduled', 'in_progress', 'cancelled')) or
      (old.status = 'scheduled' and new.status in ('open', 'in_progress', 'cancelled')) or
      (old.status = 'in_progress' and new.status in ('scheduled', 'completed', 'cancelled'))
    ) then
      raise exception 'Invalid work order status change: % -> %', old.status, new.status
        using errcode = 'check_violation';
    end if;
  end if;

  -- completed_at follows status automatically
  if new.status = 'completed' and new.completed_at is null then
    new.completed_at := now();
  elsif new.status <> 'completed' then
    new.completed_at := null;
  end if;

  return new;
end;
$$;

create trigger work_orders_enforce_status
  before insert or update on public.work_orders
  for each row execute function public.work_orders_enforce_status();

-- Incidents --------------------------------------------------------------------
-- closed is final; resolved can be closed or re-opened; resolved_at follows status.
create function public.incidents_enforce_status() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status and not public.is_seeding() then
    if old.status = 'closed' then
      raise exception 'Incident % is closed and can no longer change status', old.display_id
        using errcode = 'check_violation';
    end if;
  end if;

  if new.status in ('resolved', 'closed') then
    new.resolved_at := coalesce(new.resolved_at, now());
  else
    new.resolved_at := null;
  end if;

  return new;
end;
$$;

create trigger incidents_enforce_status
  before insert or update on public.incidents
  for each row execute function public.incidents_enforce_status();

-- Incident activity history (append-only, written with definer rights)
create function public.incidents_log_events() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := public.current_member_id();
begin
  if public.is_seeding() then
    return null;
  end if;

  if tg_op = 'INSERT' then
    insert into public.incident_events (incident_id, event_type, new_value, actor_id)
    values (new.id, 'created', jsonb_build_object('status', new.status, 'severity', new.severity), actor);
    return null;
  end if;

  if new.status is distinct from old.status then
    insert into public.incident_events (incident_id, event_type, old_value, new_value, actor_id)
    values (new.id, 'status_change', to_jsonb(old.status), to_jsonb(new.status), actor);
  end if;
  if new.assigned_to is distinct from old.assigned_to then
    insert into public.incident_events (incident_id, event_type, old_value, new_value, actor_id)
    values (new.id, 'assignment', to_jsonb(old.assigned_to), to_jsonb(new.assigned_to), actor);
  end if;
  if new.severity is distinct from old.severity then
    insert into public.incident_events (incident_id, event_type, old_value, new_value, actor_id)
    values (new.id, 'severity_change', to_jsonb(old.severity), to_jsonb(new.severity), actor);
  end if;
  return null;
end;
$$;

create trigger incidents_log_events
  after insert or update on public.incidents
  for each row execute function public.incidents_log_events();

-- Equipment audit trail ----------------------------------------------------------
create function public.equipment_audit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  diff jsonb := '{}'::jsonb;
  k text;
  old_row jsonb;
  new_row jsonb;
begin
  if public.is_seeding() then
    return null;
  end if;

  if tg_op = 'INSERT' then
    insert into public.equipment_audit_logs (equipment_id, action, actor_id)
    values (new.id, 'created', public.current_member_id());
    return null;
  end if;

  old_row := to_jsonb(old) - 'updated_at';
  new_row := to_jsonb(new) - 'updated_at';
  for k in select jsonb_object_keys(new_row) loop
    if old_row -> k is distinct from new_row -> k then
      diff := diff || jsonb_build_object(k, jsonb_build_object('old', old_row -> k, 'new', new_row -> k));
    end if;
  end loop;

  if diff <> '{}'::jsonb then
    insert into public.equipment_audit_logs (equipment_id, action, changed_fields, actor_id)
    values (new.id, 'updated', diff, public.current_member_id());
  end if;
  return null;
end;
$$;

create trigger equipment_audit
  after insert or update on public.equipment
  for each row execute function public.equipment_audit();

-- Trigger functions are not meant to be called directly.
revoke execute on function
  public.work_orders_enforce_status(), public.incidents_enforce_status(),
  public.incidents_log_events(), public.equipment_audit(), public.handle_new_user()
  from public, anon, authenticated;
