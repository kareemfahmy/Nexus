-- Nexus 0007: support for the assets milestone

-- Bucketed telemetry for charts. Averaging into buckets keeps a 14-day chart at ~60 points per
-- metric (and under PostgREST's 1000-row response cap) instead of shipping every raw reading.
-- SECURITY INVOKER (default): runs with the caller's rights, so telemetry RLS still applies.
create function public.telemetry_series(p_device_id uuid, p_since timestamptz, p_bucket interval)
returns table (bucket timestamptz, metric public.telemetry_metric, value numeric)
language sql stable set search_path = '' as $$
  select date_bin(p_bucket, t.recorded_at, timestamptz '2000-01-01') as bucket,
         t.metric,
         round(avg(t.value), 2) as value
  from public.telemetry t
  where t.device_id = p_device_id
    and t.recorded_at >= p_since
  group by 1, 2
  order by 1, 2;
$$;

revoke execute on function public.telemetry_series(uuid, timestamptz, interval) from public, anon;
grant execute on function public.telemetry_series(uuid, timestamptz, interval) to authenticated;

-- Authors default to the signed-in user's team member. The client never sends author_id, and the
-- RLS check (author_id = current_member_id()) still rejects any attempt to set someone else.
alter table public.equipment_notes alter column author_id set default public.current_member_id();
alter table public.incident_comments alter column author_id set default public.current_member_id();
