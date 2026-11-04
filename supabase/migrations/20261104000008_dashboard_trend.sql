-- Nexus 0008: weekly operations trend for the dashboard.
-- Answers "are we keeping up?": work orders created vs completed, incidents opened vs resolved.
-- SECURITY INVOKER (default): RLS on work_orders/incidents applies to the caller.
create function public.ops_weekly_trend(p_weeks integer default 12)
returns table (
  week date,
  wo_created bigint,
  wo_completed bigint,
  incidents_opened bigint,
  incidents_resolved bigint
)
language sql stable set search_path = '' as $$
  with bounds as (select least(greatest(p_weeks, 1), 52) as n),
  weeks as (
    select generate_series(
      date_trunc('week', now()) - make_interval(weeks => (select n from bounds) - 1),
      date_trunc('week', now()),
      interval '1 week'
    )::date as week
  )
  select
    w.week,
    (select count(*) from public.work_orders x where date_trunc('week', x.created_at)::date = w.week),
    (select count(*) from public.work_orders x where date_trunc('week', x.completed_at)::date = w.week),
    (select count(*) from public.incidents x where date_trunc('week', x.opened_at)::date = w.week),
    (select count(*) from public.incidents x where date_trunc('week', x.resolved_at)::date = w.week)
  from weeks w
  order by w.week;
$$;

revoke execute on function public.ops_weekly_trend(integer) from public, anon;
grant execute on function public.ops_weekly_trend(integer) to authenticated;
