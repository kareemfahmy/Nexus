-- =============================================================================
-- Nexus demo seed: realistic, FICTIONAL data generated procedurally in Postgres.
--
-- Repeatable: wipes all demo data and regenerates it. Real users, their profiles and
-- their linked team_members rows are kept.
-- Deterministic: pg_temp.r(text) derives "random" numbers from md5 hashes of stable keys,
-- so every run produces the same customers, sites, equipment and devices.
-- Time-relative: timestamps are computed from now(), so the demo never looks stale.
--
-- Run: Supabase SQL editor / MCP execute_sql / psql -f supabase/seed.sql
-- =============================================================================
begin;

-- Lets triggers skip automatic history so the seed can write historical events itself.
set local nexus.seeding = 'on';

-- Deterministic helpers -------------------------------------------------------
create function pg_temp.r(seed text) returns double precision
language sql immutable as $$
  select ('x' || substr(md5(seed), 1, 8))::bit(32)::bigint / 4294967296.0
$$;

create function pg_temp.rint(lo integer, hi integer, seed text) returns integer
language sql immutable as $$
  select lo + floor(pg_temp.r(seed) * (hi - lo + 1))::integer
$$;

create function pg_temp.pick(arr text[], seed text) returns text
language sql immutable as $$
  select arr[1 + floor(pg_temp.r(seed) * array_length(arr, 1))::integer]
$$;

create function pg_temp.hex(seed text, len integer) returns text
language sql immutable as $$
  select upper(substr(md5(seed) || md5(seed || 'x'), 1, len))
$$;

-- Wipe demo data ----------------------------------------------------------------
truncate
  public.telemetry, public.incident_events, public.incident_comments, public.incidents,
  public.equipment_notes, public.equipment_audit_logs, public.work_orders, public.devices,
  public.equipment, public.contacts, public.sites, public.customers, public.vendors
  restart identity;
delete from public.team_members where user_id is null;

-- Reference lists ----------------------------------------------------------------
create temp table ref_city (n int primary key, city text, state text, zip text, tz text, lat numeric, lng numeric)
on commit drop;
insert into ref_city values
  (1, 'Austin', 'TX', '78701', 'America/Chicago', 30.2672, -97.7431),
  (2, 'Dallas', 'TX', '75201', 'America/Chicago', 32.7767, -96.7970),
  (3, 'Houston', 'TX', '77002', 'America/Chicago', 29.7604, -95.3698),
  (4, 'Atlanta', 'GA', '30303', 'America/New_York', 33.7490, -84.3880),
  (5, 'Charlotte', 'NC', '28202', 'America/New_York', 35.2271, -80.8431),
  (6, 'Raleigh', 'NC', '27601', 'America/New_York', 35.7796, -78.6382),
  (7, 'Orlando', 'FL', '32801', 'America/New_York', 28.5384, -81.3789),
  (8, 'Tampa', 'FL', '33602', 'America/New_York', 27.9506, -82.4572),
  (9, 'Miami', 'FL', '33130', 'America/New_York', 25.7617, -80.1918),
  (10, 'Nashville', 'TN', '37203', 'America/Chicago', 36.1627, -86.7816),
  (11, 'Phoenix', 'AZ', '85004', 'America/Phoenix', 33.4484, -112.0740),
  (12, 'Denver', 'CO', '80202', 'America/Denver', 39.7392, -104.9903),
  (13, 'Chicago', 'IL', '60601', 'America/Chicago', 41.8781, -87.6298),
  (14, 'Columbus', 'OH', '43215', 'America/New_York', 39.9612, -82.9988),
  (15, 'Hartford', 'CT', '06103', 'America/New_York', 41.7658, -72.6734),
  (16, 'Boston', 'MA', '02108', 'America/New_York', 42.3601, -71.0589),
  (17, 'Philadelphia', 'PA', '19103', 'America/New_York', 39.9526, -75.1652),
  (18, 'Richmond', 'VA', '23219', 'America/New_York', 37.5407, -77.4360),
  (19, 'Las Vegas', 'NV', '89101', 'America/Los_Angeles', 36.1699, -115.1398),
  (20, 'San Diego', 'CA', '92101', 'America/Los_Angeles', 32.7157, -117.1611),
  (21, 'Sacramento', 'CA', '95814', 'America/Los_Angeles', 38.5816, -121.4944),
  (22, 'Portland', 'OR', '97204', 'America/Los_Angeles', 45.5152, -122.6784),
  (23, 'Salt Lake City', 'UT', '84111', 'America/Denver', 40.7608, -111.8910),
  (24, 'Kansas City', 'MO', '64105', 'America/Chicago', 39.0997, -94.5786);

-- People -------------------------------------------------------------------------
insert into public.team_members (full_name, email, team, title) values
  ('Ava Thompson', 'ava.thompson@nexus-demo.example', 'support', 'Support Engineer L2'),
  ('Marcus Reed', 'marcus.reed@nexus-demo.example', 'support', 'Support Engineer L2'),
  ('Priya Nair', 'priya.nair@nexus-demo.example', 'support', 'Support Engineer L1'),
  ('Diego Alvarez', 'diego.alvarez@nexus-demo.example', 'support', 'Support Engineer L1'),
  ('Hannah Brooks', 'hannah.brooks@nexus-demo.example', 'support', 'Support Lead'),
  ('Omar Haddad', 'omar.haddad@nexus-demo.example', 'operations', 'Operations Manager'),
  ('Lena Fischer', 'lena.fischer@nexus-demo.example', 'operations', 'Operations Analyst'),
  ('Jamal Carter', 'jamal.carter@nexus-demo.example', 'field_service', 'Field Technician'),
  ('Sofia Rossi', 'sofia.rossi@nexus-demo.example', 'field_service', 'Field Technician'),
  ('Ethan Walsh', 'ethan.walsh@nexus-demo.example', 'field_service', 'Senior Field Technician'),
  ('Grace Kim', 'grace.kim@nexus-demo.example', 'field_service', 'Field Technician'),
  ('Noah Patel', 'noah.patel@nexus-demo.example', 'field_service', 'Field Service Coordinator'),
  ('Isabel Moreno', 'isabel.moreno@nexus-demo.example', 'support', 'IoT Onboarding Specialist'),
  ('Victor Chen', 'victor.chen@nexus-demo.example', 'operations', 'Energy Analyst');

create temp table ref_member on commit drop as
select id, full_name, team, row_number() over (partition by team order by full_name) as n,
       count(*) over (partition by team) as team_size
from public.team_members where user_id is null;

insert into public.vendors (name, trade, phone, email) values
  ('Northwind Mechanical', 'hvac', '(512) 555-0141', 'dispatch@northwind-mech.example'),
  ('Apex Air Partners', 'hvac', '(404) 555-0187', 'service@apexair.example'),
  ('Keystone Climate Services', 'hvac', '(215) 555-0112', 'jobs@keystoneclimate.example'),
  ('Coldline Refrigeration', 'refrigeration', '(713) 555-0166', 'ops@coldline.example'),
  ('Polar Point Refrigeration', 'refrigeration', '(305) 555-0128', 'service@polarpoint.example'),
  ('Harbor Hood & Exhaust', 'exhaust', '(617) 555-0190', 'schedule@harborhood.example'),
  ('BrightPath Electrical', 'electrical', '(602) 555-0175', 'dispatch@brightpath.example'),
  ('Meridian Controls', 'controls', '(303) 555-0133', 'support@meridiancontrols.example'),
  ('Summit Field Services', 'general', '(704) 555-0159', 'service@summitfield.example'),
  ('Lakeshore Connectivity', 'network', '(312) 555-0104', 'noc@lakeshore-net.example');

-- Customers ------------------------------------------------------------------------
create temp table ref_customer (n int primary key, name text, prefix text, industry text) on commit drop;
insert into ref_customer values
  (1, 'Sunrise Pancake House', 'SPH', 'Restaurant'),
  (2, 'Harbor Grill Group', 'HGG', 'Restaurant'),
  (3, 'Copperleaf Bistro', 'CLB', 'Restaurant'),
  (4, 'Metro Fresh Grocers', 'MFG', 'Grocery'),
  (5, 'Lantern Noodle Bar', 'LNB', 'Restaurant'),
  (6, 'Cedar Smokehouse', 'CSH', 'Restaurant'),
  (7, 'Northstar Fitness Clubs', 'NFC', 'Fitness'),
  (8, 'Palmetto Coffee Roasters', 'PCR', 'Cafe'),
  (9, 'Granite Peak Hotels', 'GPH', 'Hospitality'),
  (10, 'Riverbend Pharmacy', 'RBP', 'Retail'),
  (11, 'Oak & Ember Pizza', 'OEP', 'Restaurant'),
  (12, 'Seaside Fish Market', 'SFM', 'Grocery'),
  (13, 'Prairie Burger Co.', 'PBC', 'Restaurant'),
  (14, 'Juniper Health Clinics', 'JHC', 'Healthcare'),
  (15, 'Velvet Spoon Creamery', 'VSC', 'Cafe'),
  (16, 'Ironwood Steakhouse', 'IWS', 'Restaurant'),
  (17, 'Golden Wheat Bakery', 'GWB', 'Bakery'),
  (18, 'Bluebird Daycare Centers', 'BDC', 'Education'),
  (19, 'Summit Taco Kitchen', 'STK', 'Restaurant'),
  (20, 'Willow Lane Senior Living', 'WLS', 'Healthcare');

insert into public.customers (
  name, account_number, status, industry, billing_email,
  billing_address_line1, billing_city, billing_state, billing_postal_code, payment_terms, created_at
)
select
  c.name,
  'ACC-' || (10000 + c.n * 137)::text,
  (case when c.n in (18, 20) then 'onboarding' when c.n = 15 then 'inactive' else 'active' end)::public.customer_status,
  c.industry,
  'ap@' || lower(c.prefix) || '-demo.example',
  (100 + pg_temp.rint(1, 8900, 'cust-addr' || c.n))::text || ' ' ||
    pg_temp.pick(array['Commerce St', 'Market Ave', 'Corporate Dr', 'Industrial Pkwy', 'Main St'], 'cust-st' || c.n),
  rc.city, rc.state, rc.zip,
  pg_temp.pick(array['Net 30', 'Net 30', 'Net 45', 'Net 15'], 'terms' || c.n),
  now() - make_interval(days => pg_temp.rint(400, 1600, 'cust-created' || c.n))
from ref_customer c
join ref_city rc on rc.n = 1 + (c.n * 7) % 24;

-- Sites ------------------------------------------------------------------------------
insert into public.sites (
  customer_id, code, name, status, address_line1, city, state, postal_code, timezone,
  square_footage, opened_on, latitude, longitude, created_at
)
select
  cu.id,
  rcu.prefix || '-' || (1000 + k * 211 + rcu.n * 13)::text,
  rc.city || ' ' || pg_temp.pick(array['Downtown', 'North', 'Airport', 'Riverside', 'Westgate', 'Uptown', 'Lakeside', 'Midtown'], 'site-nm' || rcu.n || '-' || k),
  (case
     when cu.status = 'inactive' then 'inactive'
     when cu.status = 'onboarding' and k > 1 then 'onboarding'
     when pg_temp.r('site-status' || rcu.n || '-' || k) < 0.05 then 'inactive'
     else 'active'
   end)::public.site_status,
  (100 + pg_temp.rint(1, 9800, 'site-addr' || rcu.n || '-' || k))::text || ' ' ||
    pg_temp.pick(array['Oak St', 'Maple Ave', 'Elm St', 'Cedar Blvd', 'Pine Rd', 'Lakeview Dr', 'Park Ave', 'Sunset Blvd', 'Highland Rd', 'Broadway'], 'site-st' || rcu.n || '-' || k),
  rc.city, rc.state, rc.zip, rc.tz,
  pg_temp.rint(18, 120, 'sqft' || rcu.n || '-' || k) * 100,
  (now() - make_interval(days => pg_temp.rint(240, 3000, 'opened' || rcu.n || '-' || k)))::date,
  rc.lat + (pg_temp.r('lat' || rcu.n || '-' || k) - 0.5) * 0.2,
  rc.lng + (pg_temp.r('lng' || rcu.n || '-' || k) - 0.5) * 0.2,
  now() - make_interval(days => pg_temp.rint(30, 900, 'site-created' || rcu.n || '-' || k))
from ref_customer rcu
join public.customers cu on cu.name = rcu.name
cross join lateral generate_series(1, pg_temp.rint(1, 4, 'site-count' || rcu.n)) as k
join ref_city rc on rc.n = 1 + ((rcu.n * 5 + k * 3) % 24);

-- Contacts: two per customer, one per site ---------------------------------------------
create temp table ref_first (n int, v text) on commit drop;
insert into ref_first select ordinality, v from unnest(array[
  'Olivia', 'Liam', 'Emma', 'Mateo', 'Charlotte', 'Elijah', 'Amelia', 'James', 'Mia', 'Lucas',
  'Harper', 'Benjamin', 'Evelyn', 'Henry', 'Aria', 'Samuel', 'Layla', 'Daniel', 'Zoe', 'Caleb'
]) with ordinality as t(v, ordinality);
create temp table ref_last (n int, v text) on commit drop;
insert into ref_last select ordinality, v from unnest(array[
  'Garcia', 'Johnson', 'Williams', 'Brown', 'Davis', 'Martinez', 'Lopez', 'Wilson', 'Anderson', 'Taylor',
  'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'White', 'Harris', 'Clark', 'Lewis', 'Young'
]) with ordinality as t(v, ordinality);

insert into public.contacts (customer_id, site_id, full_name, job_title, email, phone, is_primary)
select cu.id, null, f.v || ' ' || l.v, role.title,
       lower(f.v || '.' || l.v) || '@' || lower(replace(split_part(cu.billing_email, '@', 2), ' ', '')),
       '(' || (200 + pg_temp.rint(1, 700, 'ph-a' || cu.account_number || role.k)) || ') 555-' || lpad(pg_temp.rint(100, 9999, 'ph-b' || cu.account_number || role.k)::text, 4, '0'),
       role.k = 1
from public.customers cu
cross join (values (1, 'Facilities Director'), (2, 'Accounts Payable')) as role(k, title)
join ref_first f on f.n = pg_temp.rint(1, 20, 'cf' || cu.account_number || role.k)
join ref_last l on l.n = pg_temp.rint(1, 20, 'cl' || cu.account_number || role.k);

insert into public.contacts (customer_id, site_id, full_name, job_title, email, phone, is_primary)
select s.customer_id, s.id, f.v || ' ' || l.v, 'General Manager',
       lower(f.v || '.' || l.v) || '.' || lower(replace(s.code, '-', '')) || '@store-demo.example',
       '(' || (200 + pg_temp.rint(1, 700, 'sph-a' || s.code)) || ') 555-' || lpad(pg_temp.rint(100, 9999, 'sph-b' || s.code)::text, 4, '0'),
       true
from public.sites s
join ref_first f on f.n = pg_temp.rint(1, 20, 'sf' || s.code)
join ref_last l on l.n = pg_temp.rint(1, 20, 'sl' || s.code);

-- Equipment ------------------------------------------------------------------------------
insert into public.equipment (
  site_id, category, name, area_served, manufacturer, model, serial_number,
  install_date, warranty_until, status, specs, created_at
)
select
  s.id,
  cat.category::public.equipment_category,
  case cat.category
    when 'hvac' then 'HVAC [' || k || '] - ' || area
    when 'cooler' then 'Cooler [' || k || '] - ' || area
    when 'freezer' then 'Freezer [' || k || '] - ' || area
    when 'make_up_air' then 'MAU [' || k || '] - ' || area
    when 'exhaust' then 'Exhaust [' || k || '] - ' || area
    else area || ' [' || k || ']'
  end,
  area,
  mfr,
  upper(substr(mfr, 1, 2)) || '-' || pg_temp.rint(100, 999, 'mdl' || key) || pg_temp.pick(array['A', 'B', 'C', 'X', 'D'], 'mdl2' || key),
  pg_temp.hex('sn' || key, 10),
  inst,
  inst + interval '5 years',
  (case
     when pg_temp.r('eq-status' || key) < 0.84 then 'operational'
     when pg_temp.r('eq-status' || key) < 0.93 then 'degraded'
     when pg_temp.r('eq-status' || key) < 0.97 then 'down'
     else 'decommissioned'
   end)::public.equipment_status,
  case cat.category
    when 'hvac' then jsonb_build_object(
      'tonnage', (array[3, 5, 7.5, 10, 12.5])[pg_temp.rint(1, 5, 'ton' || key)],
      'unit_type', pg_temp.pick(array['Rooftop unit', 'Split system', 'Heat pump'], 'ut' || key),
      'refrigerant', pg_temp.pick(array['R-410A', 'R-454B'], 'ref' || key))
    when 'cooler' then jsonb_build_object('setpoint_f', 37, 'door', pg_temp.pick(array['Walk-in', 'Reach-in'], 'door' || key))
    when 'freezer' then jsonb_build_object('setpoint_f', -5, 'door', pg_temp.pick(array['Walk-in', 'Reach-in'], 'door' || key))
    when 'make_up_air' then jsonb_build_object('cfm', pg_temp.rint(20, 60, 'cfm' || key) * 100, 'gas_heat', true)
    when 'exhaust' then jsonb_build_object('cfm', pg_temp.rint(15, 50, 'cfm' || key) * 100)
    else '{}'::jsonb
  end,
  inst::timestamptz
from public.sites s
cross join lateral (values
  ('hvac', pg_temp.rint(1, 3, 'n-hvac' || s.code)),
  ('cooler', pg_temp.rint(1, 2, 'n-cool' || s.code)),
  ('freezer', pg_temp.rint(0, 1, 'n-frz' || s.code)),
  ('make_up_air', pg_temp.rint(0, 1, 'n-mau' || s.code)),
  ('exhaust', pg_temp.rint(0, 1, 'n-exh' || s.code)),
  ('other', case when pg_temp.r('n-oth' || s.code) < 0.15 then 1 else 0 end)
) as cat(category, cnt)
cross join lateral generate_series(1, cat.cnt) as k
cross join lateral (select s.code || '-' || cat.category || '-' || k as key) as kk
cross join lateral (select
  case cat.category
    when 'hvac' then pg_temp.pick(array['Kitchen', 'Dining', 'Lobby', 'North', 'South', 'Main', 'Office', 'Bar'], 'area' || key)
    when 'cooler' then pg_temp.pick(array['Walk-in', 'Reach-in', 'Prep line', 'Bar'], 'area' || key)
    when 'freezer' then pg_temp.pick(array['Walk-in', 'Reach-in', 'Food'], 'area' || key)
    when 'make_up_air' then 'Kitchen'
    when 'exhaust' then pg_temp.pick(array['Hood', 'Front room', 'Dish area', 'Restrooms'], 'area' || key)
    else pg_temp.pick(array['Ice machine', 'Water heater', 'Dishwasher booster'], 'area' || key)
  end as area,
  case cat.category
    when 'hvac' then pg_temp.pick(array['Carrier', 'Trane', 'Lennox', 'York', 'Rheem', 'Daikin'], 'mfr' || key)
    when 'cooler' then pg_temp.pick(array['Master-Bilt', 'Kolpak', 'Norlake', 'True'], 'mfr' || key)
    when 'freezer' then pg_temp.pick(array['Master-Bilt', 'Kolpak', 'Norlake', 'Hussmann'], 'mfr' || key)
    when 'make_up_air' then pg_temp.pick(array['Greenheck', 'CaptiveAire'], 'mfr' || key)
    when 'exhaust' then pg_temp.pick(array['Greenheck', 'CaptiveAire', 'Loren Cook'], 'mfr' || key)
    else pg_temp.pick(array['Hoshizaki', 'Manitowoc', 'A.O. Smith'], 'mfr' || key)
  end as mfr,
  least(s.opened_on + pg_temp.rint(0, 500, 'inst' || key), current_date - 10) as inst
) as attrs;

-- Devices ------------------------------------------------------------------------------
-- Thermostats (75% of HVAC) and controllers (20% of HVAC)
insert into public.devices (site_id, equipment_id, device_type, name, external_id, manufacturer, model, firmware_version, installed_on)
select e.site_id, e.id, 'thermostat', 'Thermostat - ' || e.name,
       '00:1B:' || substr(pg_temp.hex('mac' || e.serial_number, 8), 1, 2) || ':' || substr(pg_temp.hex('mac' || e.serial_number, 8), 3, 2) || ':' ||
         substr(pg_temp.hex('mac' || e.serial_number, 8), 5, 2) || ':' || substr(pg_temp.hex('mac' || e.serial_number, 8), 7, 2),
       m.mfr, m.model, pg_temp.pick(array['4.8.2', '4.8.2', '4.9.0', '4.7.5'], 'fw' || e.serial_number),
       e.install_date + 30
from public.equipment e
cross join lateral (select
  pg_temp.pick(array['Ecobee', 'Honeywell', 'Pelican'], 'tmfr' || e.serial_number) as mfr) m0
cross join lateral (select m0.mfr,
  case m0.mfr when 'Ecobee' then 'SmartThermostat Pro' when 'Honeywell' then 'T10 Pro' else 'TS200' end as model) m
where e.category = 'hvac' and e.status <> 'decommissioned' and pg_temp.r('has-tstat' || e.serial_number) < 0.75;

insert into public.devices (site_id, equipment_id, device_type, name, external_id, manufacturer, model, firmware_version, installed_on)
select e.site_id, e.id, 'controller', 'Controller - ' || e.name, 'CTL-' || pg_temp.hex('ctl' || e.serial_number, 10),
       pg_temp.pick(array['Siemens', 'Johnson Controls'], 'cmfr' || e.serial_number), 'RTU-Edge 2', '2.3.1', e.install_date + 60
from public.equipment e
where e.category = 'hvac' and e.status <> 'decommissioned' and pg_temp.r('has-ctl' || e.serial_number) < 0.2;

-- Temperature sensors on coolers and freezers (75%), LoRaWAN DevEUI identifiers
insert into public.devices (site_id, equipment_id, device_type, name, external_id, manufacturer, model, firmware_version, installed_on)
select e.site_id, e.id, 'temp_sensor', 'Temp sensor - ' || e.name, pg_temp.hex('eui' || e.serial_number, 16),
       pg_temp.pick(array['Milesight', 'Elsys', 'Monnit'], 'smfr' || e.serial_number), 'LoRa-TH 300', '1.6.0', e.install_date + 45
from public.equipment e
where e.category in ('cooler', 'freezer') and e.status <> 'decommissioned' and pg_temp.r('has-sensor' || e.serial_number) < 0.75;

-- Site-level devices: one gateway per site, energy meter (50%), humidity sensor (15%)
insert into public.devices (site_id, equipment_id, device_type, name, external_id, manufacturer, model, firmware_version, installed_on)
select s.id, null, 'gateway', 'Gateway - ' || s.code, 'GW-' || pg_temp.hex('gw' || s.code, 12),
       pg_temp.pick(array['Cradlepoint', 'Pepwave', 'Kerlink'], 'gmfr' || s.code), 'IoT Edge GW', '7.2.4', s.opened_on + 20
from public.sites s;

insert into public.devices (site_id, equipment_id, device_type, name, external_id, manufacturer, model, firmware_version, installed_on)
select s.id, null, 'energy_meter', 'Energy meter - Main panel', 'EM-' || pg_temp.hex('em' || s.code, 10),
       pg_temp.pick(array['Eaton', 'Schneider Electric'], 'emfr' || s.code), 'PowerLogic 3', '3.1.0', s.opened_on + 25
from public.sites s where pg_temp.r('has-meter' || s.code) < 0.5;

insert into public.devices (site_id, equipment_id, device_type, name, external_id, manufacturer, model, firmware_version, installed_on)
select s.id, null, 'humidity_sensor', 'Humidity sensor - Dining', pg_temp.hex('hum' || s.code, 16),
       'Milesight', 'LoRa-TH 300', '1.6.0', s.opened_on + 40
from public.sites s where pg_temp.r('has-hum' || s.code) < 0.15;

-- Connectivity: inactive sites and sites with an offline gateway are entirely offline.
update public.devices d set connectivity_status = (case
    when d.device_type = 'gateway' then
      case when pg_temp.r('conn' || d.external_id) < 0.93 then 'online'
           when pg_temp.r('conn' || d.external_id) < 0.97 then 'warning' else 'offline' end
    when pg_temp.r('conn' || d.external_id) < 0.80 then 'online'
    when pg_temp.r('conn' || d.external_id) < 0.90 then 'warning'
    when pg_temp.r('conn' || d.external_id) < 0.97 then 'offline'
    else 'unknown'
  end)::public.connectivity_status;

update public.devices d set connectivity_status = 'offline'
from public.sites s
where s.id = d.site_id and (
  s.status = 'inactive'
  or exists (select 1 from public.devices g where g.site_id = s.id and g.device_type = 'gateway' and g.connectivity_status = 'offline')
);

update public.devices d set
  last_seen_at = case d.connectivity_status
    when 'online' then now() - make_interval(mins => pg_temp.rint(1, 12, 'seen' || d.external_id))
    when 'warning' then now() - make_interval(mins => pg_temp.rint(25, 180, 'seen' || d.external_id))
    when 'offline' then now() - make_interval(hours => pg_temp.rint(26, 240, 'seen' || d.external_id))
    else null
  end,
  health_score = case d.connectivity_status
    when 'online' then pg_temp.rint(85, 100, 'hp' || d.external_id)
    when 'warning' then pg_temp.rint(45, 75, 'hp' || d.external_id)
    when 'offline' then pg_temp.rint(0, 30, 'hp' || d.external_id)
    else null
  end;

-- Telemetry: hourly for the last 14 days, until the device was last seen -----------------
insert into public.telemetry (device_id, recorded_at, metric, value)
select d.id, ts, m.metric::public.telemetry_metric, round(m.v::numeric, 2)
from public.devices d
join public.sites s on s.id = d.site_id
left join public.equipment e on e.id = d.equipment_id
cross join lateral generate_series(
  date_trunc('hour', now() - interval '14 days'),
  coalesce(d.last_seen_at, now()),
  interval '1 hour'
) as ts
cross join lateral (select
  extract(hour from ts at time zone s.timezone)::int as h,
  pg_temp.r(d.external_id || ts::text) as noise,
  extract(hour from ts at time zone s.timezone)::int between 7 and 21 as occupied,
  case when d.connectivity_status = 'warning' or e.status in ('degraded', 'down') then 1 else 0 end as fault
) as x
cross join lateral (
  select 'room_temp_f' as metric,
         (case when x.occupied then 71.5 else 75 end) + 1.6 * sin(2 * pi() * (x.h - 15) / 24.0) + (x.noise - 0.5) * 1.4 + x.fault * 3.5 as v
  where d.device_type = 'thermostat'
  union all
  select 'humidity_pct', 46 + 7 * sin(2 * pi() * (x.h - 5) / 24.0) + (x.noise - 0.5) * 5 + x.fault * 6
  where d.device_type in ('thermostat', 'humidity_sensor')
  union all
  select 'cooling_setpoint_f', case when x.occupied then 72 else 78 end where d.device_type = 'thermostat'
  union all
  select 'heating_setpoint_f', case when x.occupied then 68 else 62 end where d.device_type = 'thermostat'
  union all
  select 'temperature_f',
         case when e.category = 'freezer' then -3 + (x.noise - 0.5) * 3 + x.fault * 14
              else 36.5 + (x.noise - 0.5) * 2 + x.fault * 7 end
           + case when pg_temp.r('door' || d.external_id || ts::text) < 0.03 then 5 else 0 end
  where d.device_type = 'temp_sensor'
  union all
  select 'power_kw', 6 + (case when x.occupied then 14 else 0 end) + 3 * sin(2 * pi() * (x.h - 14) / 24.0) + (x.noise - 0.5) * 3
  where d.device_type = 'energy_meter'
) as m
where d.connectivity_status <> 'unknown';

-- Work orders ------------------------------------------------------------------------------
create temp table ref_wo (n int primary key, category text, title text, trade text) on commit drop;
insert into ref_wo values
  (1, 'hvac', 'Quarterly PM: filters, belts and coil cleaning', 'hvac'),
  (2, 'hvac', 'Unit not cooling, investigate compressor', 'hvac'),
  (3, 'hvac', 'Replace failed thermostat', 'controls'),
  (4, 'hvac', 'Refrigerant leak check', 'hvac'),
  (5, 'cooler', 'Walk-in cooler not holding temperature', 'refrigeration'),
  (6, 'cooler', 'Replace door gasket and adjust closer', 'refrigeration'),
  (7, 'freezer', 'Freezer ice build-up on evaporator', 'refrigeration'),
  (8, 'freezer', 'Defrost timer replacement', 'refrigeration'),
  (9, 'make_up_air', 'MAU burner inspection', 'hvac'),
  (10, 'exhaust', 'Hood and exhaust fan cleaning', 'exhaust'),
  (11, 'exhaust', 'Exhaust fan belt replacement', 'exhaust'),
  (12, 'other', 'Ice machine descale and sanitize', 'general'),
  (13, 'site', 'Gateway offline, on-site connectivity check', 'network'),
  (14, 'site', 'Energy meter CT installation', 'electrical'),
  (15, 'site', 'Sensor battery replacement round', 'controls');

with site_jobs as (
  select s.id as site_id, s.code, k, s.code || '-wo-' || k as key
  from public.sites s
  cross join lateral generate_series(1, pg_temp.rint(1, 4, 'wo-count' || s.code)) as k
  where s.status <> 'onboarding' or k = 1
),
jobs as (
  select j.*, eq.id as equipment_id, coalesce(eq.category::text, 'site') as category,
         pg_temp.r('wo-status' || j.key) as rs
  from site_jobs j
  left join lateral (
    select e.id, e.category from public.equipment e
    where e.site_id = j.site_id and pg_temp.r('wo-has-eq' || j.key) < 0.85
    order by md5(e.serial_number || j.key) limit 1
  ) eq on true
),
shaped as (
  select jobs.*,
    (case when rs < 0.45 then 'completed' when rs < 0.53 then 'cancelled' when rs < 0.70 then 'scheduled'
          when rs < 0.83 then 'in_progress' else 'open' end) as status,
    t.title, t.trade
  from jobs
  cross join lateral (
    select title, trade from ref_wo
    where ref_wo.category = jobs.category
    order by md5(ref_wo.n::text || jobs.key) limit 1
  ) t
),
timed as (
  select shaped.*,
    case when status in ('completed', 'cancelled')
      then now() - make_interval(days => pg_temp.rint(10, 160, 'wo-created' || key), hours => pg_temp.rint(0, 20, 'wo-h' || key))
      else now() - make_interval(days => pg_temp.rint(0, 25, 'wo-created' || key), hours => pg_temp.rint(0, 20, 'wo-h' || key))
    end as created_at
  from shaped
)
insert into public.work_orders (
  site_id, equipment_id, title, description, priority, status, vendor_id, assigned_to,
  scheduled_for, completed_at, created_by, created_at, updated_at
)
select
  t.site_id, t.equipment_id, t.title,
  'Raised from ' || pg_temp.pick(array['an alert threshold breach', 'a store manager call', 'the preventive maintenance plan', 'a support incident', 'a technician visit'], 'wo-src' || t.key)
    || '. ' || pg_temp.pick(array['Please confirm parts availability before dispatch.', 'Access via rear entrance, ask for the manager on duty.', 'Coordinate around lunch service (11:00 to 14:00).', 'Photos of the work area required on completion.'], 'wo-note' || t.key),
  (case when pg_temp.r('wo-pri' || t.key) < 0.12 then 'urgent' when pg_temp.r('wo-pri' || t.key) < 0.38 then 'high'
        when pg_temp.r('wo-pri' || t.key) < 0.80 then 'medium' else 'low' end)::public.wo_priority,
  t.status::public.wo_status,
  (select v.id from public.vendors v where v.trade = t.trade or (t.trade = 'controls' and v.trade = 'controls')
     order by md5(v.name || t.key) limit 1),
  (select m.id from ref_member m where m.team = 'field_service' order by md5(m.full_name || t.key) limit 1),
  case
    when t.status = 'open' and pg_temp.r('wo-unsched' || t.key) < 0.5 then null
    when t.status in ('completed', 'cancelled') then t.created_at + make_interval(days => pg_temp.rint(1, 10, 'wo-sched' || t.key))
    else now() + make_interval(days => pg_temp.rint(-7, 12, 'wo-sched' || t.key), hours => pg_temp.rint(0, 8, 'wo-sh' || t.key))
  end,
  case when t.status = 'completed'
    then least(t.created_at + make_interval(days => pg_temp.rint(1, 10, 'wo-sched' || t.key), hours => pg_temp.rint(2, 40, 'wo-done' || t.key)), now() - interval '1 hour')
  end,
  (select m.id from ref_member m where m.team in ('support', 'operations') order by md5(m.full_name || 'by' || t.key) limit 1),
  t.created_at,
  t.created_at
from timed t
order by t.created_at;

-- Incidents ---------------------------------------------------------------------------------
create temp table ref_incident (n int primary key, kind text, title text) on commit drop;
insert into ref_incident values
  (1, 'device', 'Device not reporting'),
  (2, 'device', 'Intermittent connectivity'),
  (3, 'device', 'Sensor battery low'),
  (4, 'device', 'Readings out of expected range'),
  (5, 'equipment', 'Temperature above setpoint'),
  (6, 'equipment', 'Unit short cycling'),
  (7, 'equipment', 'Thermostat schedule incorrect'),
  (8, 'equipment', 'Compressor alarm'),
  (9, 'site', 'Site gateway offline'),
  (10, 'site', 'Power loss at site'),
  (11, 'site', 'Setup issue during installation'),
  (12, 'site', 'Internet provider outage');

with picks as (
  select i, 'inc-' || i as key,
         (select s.id from public.sites s order by md5(s.code || 'inc-site' || i) limit 1) as site_id,
         pg_temp.r('inc-kind' || i) as rk,
         pg_temp.r('inc-status' || i) as rs,
         pg_temp.r('inc-sev' || i) as rsev
  from generate_series(1, 62) as i
),
typed as (
  select p.*,
    case when rk < 0.45 then 'device' when rk < 0.85 then 'equipment' else 'site' end as kind,
    (case when rs < 0.15 then 'open' when rs < 0.30 then 'in_progress' when rs < 0.40 then 'pending'
          when rs < 0.75 then 'resolved' else 'closed' end) as status
  from picks p
),
linked as (
  select t.*,
    case when t.kind = 'device' then (
      select d.id from public.devices d where d.site_id = t.site_id
      order by (d.connectivity_status in ('offline', 'warning')) desc, md5(d.external_id || t.key) limit 1) end as device_id,
    case when t.kind = 'equipment' then (
      select e.id from public.equipment e where e.site_id = t.site_id
      order by (e.status in ('degraded', 'down')) desc, md5(e.serial_number || t.key) limit 1) end as equipment_id,
    (select ri.title from ref_incident ri where ri.kind = t.kind order by md5(ri.n::text || t.key) limit 1) as title,
    case when t.status in ('resolved', 'closed')
      then now() - make_interval(days => pg_temp.rint(5, 160, 'inc-open' || t.key), hours => pg_temp.rint(0, 20, 'inc-oh' || t.key))
      else now() - make_interval(days => pg_temp.rint(0, 18, 'inc-open' || t.key), hours => pg_temp.rint(0, 20, 'inc-oh' || t.key))
    end as opened_at
  from typed t
)
insert into public.incidents (
  site_id, equipment_id, device_id, title, description, severity, status, assigned_to,
  root_cause, resolution, opened_at, resolved_at, created_by, created_at, updated_at
)
select
  l.site_id, l.equipment_id, l.device_id, l.title,
  pg_temp.pick(array[
    'Detected by automated monitoring. Customer has not reported impact yet.',
    'Store manager reported the issue by phone during opening checks.',
    'Alert fired three times in the last hour; escalated from L1.',
    'Raised by the field technician after the last site visit.'
  ], 'inc-desc' || l.key),
  (case when rsev < 0.08 then 'sev1' when rsev < 0.30 then 'sev2' when rsev < 0.75 then 'sev3' else 'sev4' end)::public.incident_severity,
  l.status::public.incident_status,
  case when l.status = 'open' and pg_temp.r('inc-unassigned' || l.key) < 0.4 then null
       else (select m.id from ref_member m where m.team = 'support' order by md5(m.full_name || l.key) limit 1) end,
  case when l.status in ('resolved', 'closed') or (l.status = 'pending' and pg_temp.r('inc-rc' || l.key) < 0.5)
    then pg_temp.pick(array['Gateway connectivity', 'Power loss at site', 'Sensor battery depleted', 'Configuration error',
                            'Hardware failure', 'Network provider outage', 'Installation defect', 'Customer-side change'], 'inc-rc' || l.key) end,
  case when l.status in ('resolved', 'closed')
    then pg_temp.pick(array['Replaced the failed component and verified readings for 24 hours.',
                            'Power-cycled the gateway remotely; all devices reconnected.',
                            'Corrected the schedule configuration and confirmed with the store manager.',
                            'Technician replaced the battery on site and re-paired the sensor.',
                            'Provider restored service; no action required on our side.'], 'inc-res' || l.key) end,
  l.opened_at,
  case when l.status in ('resolved', 'closed')
    then l.opened_at + make_interval(hours => pg_temp.rint(2, 120, 'inc-res-h' || l.key)) end,
  (select m.id from ref_member m where m.team in ('support', 'operations') order by md5(m.full_name || 'by' || l.key) limit 1),
  l.opened_at,
  l.opened_at
from linked l
order by l.opened_at;

-- Incident history: created -> (in progress) -> current status, plus assignment
insert into public.incident_events (incident_id, event_type, new_value, actor_id, created_at)
select i.id, 'created', jsonb_build_object('status', 'open', 'severity', i.severity), i.created_by, i.opened_at
from public.incidents i;

insert into public.incident_events (incident_id, event_type, old_value, new_value, actor_id, created_at)
select i.id, 'assignment', 'null'::jsonb, to_jsonb(i.assigned_to), i.created_by, i.opened_at + interval '12 minutes'
from public.incidents i where i.assigned_to is not null;

insert into public.incident_events (incident_id, event_type, old_value, new_value, actor_id, created_at)
select i.id, 'status_change', to_jsonb('open'::text), to_jsonb('in_progress'::text), i.assigned_to, i.opened_at + interval '40 minutes'
from public.incidents i where i.status <> 'open';

insert into public.incident_events (incident_id, event_type, old_value, new_value, actor_id, created_at)
select i.id, 'status_change', to_jsonb('in_progress'::text), to_jsonb(i.status), i.assigned_to,
       coalesce(i.resolved_at, i.opened_at + interval '3 hours')
from public.incidents i where i.status in ('pending', 'resolved', 'closed');

-- Comments: 0 to 4 per incident, in time order
insert into public.incident_comments (incident_id, author_id, body, created_at, updated_at)
select i.id,
       coalesce(i.assigned_to, (select m.id from ref_member m where m.team = 'support' order by md5(m.full_name || i.display_id || c) limit 1)),
       pg_temp.pick(array[
         'Checked the device dashboard; last uplink was received before the outage window.',
         'Called the store. Manager confirmed the unit is running but the dining room feels warm.',
         'Remote reboot sent to the gateway. Waiting for devices to rejoin.',
         'Opened a work order with the vendor for an on-site visit.',
         'Readings back within range for the last two hours. Monitoring before closing.',
         'Customer asked for a summary for their facilities director.',
         'Escalating to L2: issue persists after the standard checklist.'
       ], 'cmt' || i.display_id || c),
       i.opened_at + make_interval(hours => c * pg_temp.rint(1, 6, 'cmt-h' || i.display_id || c)),
       i.opened_at + make_interval(hours => c * pg_temp.rint(1, 6, 'cmt-h' || i.display_id || c))
from public.incidents i
cross join lateral generate_series(1, pg_temp.rint(0, 4, 'cmt-n' || i.display_id)) as c
where i.opened_at + make_interval(hours => c * pg_temp.rint(1, 6, 'cmt-h' || i.display_id || c)) < now();

-- Equipment history -------------------------------------------------------------------------
insert into public.equipment_audit_logs (equipment_id, action, changed_fields, created_at)
select e.id, 'created', '{}'::jsonb, e.install_date::timestamptz from public.equipment e;

insert into public.equipment_audit_logs (equipment_id, action, changed_fields, actor_id, created_at)
select e.id, 'updated',
       jsonb_build_object('status', jsonb_build_object('old', 'operational', 'new', e.status)),
       (select m.id from ref_member m where m.team = 'field_service' order by md5(m.full_name || e.serial_number) limit 1),
       now() - make_interval(days => pg_temp.rint(1, 20, 'aud' || e.serial_number))
from public.equipment e where e.status <> 'operational';

insert into public.equipment_notes (equipment_id, author_id, body, created_at, updated_at)
select e.id,
       (select m.id from ref_member m where m.team in ('field_service', 'support') order by md5(m.full_name || 'note' || e.serial_number::text) limit 1),
       pg_temp.pick(array[
         'Filters replaced during quarterly PM. Next change due in 90 days.',
         'Unit is original to the building; plan for replacement in next capex cycle.',
         'Access panel screws stripped; bring replacement hardware next visit.',
         'Customer requested quieter operation during dining hours.',
         'Door gasket shows wear on the hinge side.',
         'Thermostat relocated away from the kitchen pass to avoid false readings.'
       ], 'note' || e.serial_number),
       now() - make_interval(days => pg_temp.rint(1, 120, 'note-d' || e.serial_number)),
       now() - make_interval(days => pg_temp.rint(1, 120, 'note-d' || e.serial_number))
from public.equipment e where pg_temp.r('has-note' || e.serial_number) < 0.4;

commit;

analyze;
