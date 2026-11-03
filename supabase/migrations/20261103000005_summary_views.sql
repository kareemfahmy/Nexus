-- Nexus 0005: read-model views for summaries and dashboards
-- security_invoker = true makes views run with the CALLER's permissions, so RLS still applies.
-- Every KPI the UI shows is derived here from real rows; nothing is hardcoded in Angular.

-- Per-site health summary (site lists, customer detail, site header chips)
create view public.v_site_summary with (security_invoker = true) as
select
  s.id,
  s.code,
  s.name,
  s.status,
  s.city,
  s.state,
  s.customer_id,
  c.name as customer_name,
  coalesce(e.equipment_count, 0) as equipment_count,
  coalesce(e.equipment_down, 0) as equipment_down,
  coalesce(d.device_count, 0) as device_count,
  coalesce(d.devices_online, 0) as devices_online,
  coalesce(d.devices_warning, 0) as devices_warning,
  coalesce(d.devices_offline, 0) as devices_offline,
  coalesce(d.devices_unknown, 0) as devices_unknown,
  coalesce(w.open_work_orders, 0) as open_work_orders,
  coalesce(w.overdue_work_orders, 0) as overdue_work_orders,
  coalesce(i.open_incidents, 0) as open_incidents,
  coalesce(i.critical_incidents, 0) as critical_incidents
from public.sites s
join public.customers c on c.id = s.customer_id
left join lateral (
  select count(*) as equipment_count,
         count(*) filter (where status = 'down') as equipment_down
  from public.equipment where site_id = s.id and status <> 'decommissioned'
) e on true
left join lateral (
  select count(*) as device_count,
         count(*) filter (where connectivity_status = 'online') as devices_online,
         count(*) filter (where connectivity_status = 'warning') as devices_warning,
         count(*) filter (where connectivity_status = 'offline') as devices_offline,
         count(*) filter (where connectivity_status = 'unknown') as devices_unknown
  from public.devices where site_id = s.id
) d on true
left join lateral (
  select count(*) filter (where status in ('open', 'scheduled', 'in_progress')) as open_work_orders,
         count(*) filter (where status in ('open', 'scheduled', 'in_progress') and scheduled_for < now()) as overdue_work_orders
  from public.work_orders where site_id = s.id
) w on true
left join lateral (
  select count(*) filter (where status in ('open', 'in_progress', 'pending')) as open_incidents,
         count(*) filter (where status in ('open', 'in_progress', 'pending') and severity in ('sev1', 'sev2')) as critical_incidents
  from public.incidents where site_id = s.id
) i on true;

-- Platform-wide KPIs (single row) for the dashboard.
-- Asset and device counts cover operating sites only: devices at inactive (churned) sites are
-- expected to be offline and would otherwise inflate the "needs attention" numbers.
create view public.v_dashboard_kpis with (security_invoker = true) as
with live_devices as (
  select d.connectivity_status
  from public.devices d join public.sites s on s.id = d.site_id
  where s.status <> 'inactive'
)
select
  (select count(*) from public.customers where status <> 'inactive') as customers,
  (select count(*) from public.sites where status <> 'inactive') as sites,
  (select count(*) from public.equipment e join public.sites s on s.id = e.site_id
     where e.status <> 'decommissioned' and s.status <> 'inactive') as equipment,
  (select count(*) from live_devices) as devices,
  (select count(*) from live_devices where connectivity_status = 'online') as devices_online,
  (select count(*) from live_devices where connectivity_status = 'offline') as devices_offline,
  (select count(*) from live_devices where connectivity_status = 'warning') as devices_warning,
  (select count(*) from live_devices where connectivity_status = 'unknown') as devices_unknown,
  (select count(*) from public.work_orders where status in ('open', 'scheduled', 'in_progress')) as active_work_orders,
  (select count(*) from public.work_orders
     where status in ('open', 'scheduled', 'in_progress') and scheduled_for < now()) as overdue_work_orders,
  (select count(*) from public.incidents where status in ('open', 'in_progress', 'pending')) as open_incidents,
  (select count(*) from public.incidents
     where status in ('open', 'in_progress', 'pending') and severity in ('sev1', 'sev2')) as critical_incidents;

-- Latest reading per device and metric (thermostat state cards, device lists)
create view public.v_device_latest with (security_invoker = true) as
select distinct on (t.device_id, t.metric)
  t.device_id,
  t.metric,
  t.value,
  t.recorded_at
from public.telemetry t
order by t.device_id, t.metric, t.recorded_at desc;
