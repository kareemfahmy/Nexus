-- Nexus 0002: core tables, relationships and indexes
-- Hierarchy: customers -> sites -> equipment / devices -> work orders / incidents.
-- Customer is reached through site (never duplicated on child tables) to avoid inconsistency.

-- Generic updated_at maintenance
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- People -------------------------------------------------------------------

-- One row per signed-in (non-anonymous) auth user. Holds the security role.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Directory of people who can be assigned work or author comments.
-- Seeded staff have no login (user_id null); real users get a linked row on signup.
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  full_name text not null check (length(trim(full_name)) > 0),
  email text,
  team public.team not null default 'support',
  title text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  trade text not null,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Accounts and locations ---------------------------------------------------

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  account_number text not null unique,
  status public.customer_status not null default 'active',
  industry text,
  billing_email text,
  billing_address_line1 text,
  billing_city text,
  billing_state text,
  billing_postal_code text,
  payment_terms text not null default 'Net 30',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete restrict,
  code text not null unique,
  name text not null,
  status public.site_status not null default 'active',
  address_line1 text not null,
  city text not null,
  state text not null,
  postal_code text not null,
  timezone text not null default 'America/New_York',
  square_footage integer check (square_footage > 0),
  opened_on date,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A contact belongs to a customer, and optionally to one of its sites.
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  site_id uuid references public.sites (id) on delete cascade,
  full_name text not null,
  job_title text,
  email text,
  phone text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Assets -------------------------------------------------------------------

create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete restrict,
  category public.equipment_category not null,
  name text not null,
  area_served text,
  manufacturer text,
  model text,
  serial_number text,
  install_date date,
  warranty_until date,
  status public.equipment_status not null default 'operational',
  specs jsonb not null default '{}'::jsonb, -- category-specific details (tonnage, unit type...)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint equipment_warranty_after_install
    check (warranty_until is null or install_date is null or warranty_until >= install_date)
);

-- IoT devices are separate from equipment: a thermostat MAY be attached to an HVAC unit,
-- a gateway usually is not attached to anything.
create table public.devices (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete restrict,
  equipment_id uuid references public.equipment (id) on delete set null,
  device_type public.device_type not null,
  name text not null,
  external_id text not null unique, -- MAC / LoRaWAN DevEUI / vendor id
  manufacturer text,
  model text,
  provider text not null default 'simulated', -- future: 'aws_iot', 'incontrol'
  is_simulated boolean not null default true,
  firmware_version text,
  connectivity_status public.connectivity_status not null default 'unknown',
  last_seen_at timestamptz,
  health_score smallint check (health_score between 0 and 100),
  installed_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.telemetry (
  id bigint generated always as identity primary key,
  device_id uuid not null references public.devices (id) on delete cascade,
  recorded_at timestamptz not null,
  metric public.telemetry_metric not null,
  value numeric(10, 2) not null
);

-- Operations ---------------------------------------------------------------

create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  wo_number bigint generated always as identity (start with 100001) unique,
  display_id text generated always as ('WO-' || wo_number::text) stored,
  site_id uuid not null references public.sites (id) on delete restrict,
  equipment_id uuid references public.equipment (id) on delete set null,
  title text not null,
  description text,
  priority public.wo_priority not null default 'medium',
  status public.wo_status not null default 'open',
  vendor_id uuid references public.vendors (id) on delete set null,
  assigned_to uuid references public.team_members (id) on delete set null,
  scheduled_for timestamptz,
  completed_at timestamptz,
  created_by uuid references public.team_members (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_orders_completed_has_date
    check (status <> 'completed' or completed_at is not null),
  constraint work_orders_completed_at_only_when_completed
    check (completed_at is null or status = 'completed')
);

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  incident_number bigint generated always as identity (start with 5001) unique,
  display_id text generated always as ('INC-' || incident_number::text) stored,
  site_id uuid not null references public.sites (id) on delete restrict,
  equipment_id uuid references public.equipment (id) on delete set null,
  device_id uuid references public.devices (id) on delete set null,
  title text not null,
  description text,
  severity public.incident_severity not null default 'sev3',
  status public.incident_status not null default 'open',
  assigned_to uuid references public.team_members (id) on delete set null,
  root_cause text,
  resolution text,
  opened_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_by uuid references public.team_members (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Resolving requires an explanation: enforced in the database, not only in the form.
  constraint incidents_resolution_required
    check (status not in ('resolved', 'closed') or (root_cause is not null and resolution is not null))
);

create table public.incident_comments (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  author_id uuid not null references public.team_members (id) on delete restrict,
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Written only by triggers (see 0004); clients can read but never write.
create table public.incident_events (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  event_type public.incident_event_type not null,
  old_value jsonb,
  new_value jsonb,
  actor_id uuid references public.team_members (id) on delete set null, -- null = system
  created_at timestamptz not null default now()
);

create table public.equipment_notes (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references public.equipment (id) on delete cascade,
  author_id uuid not null references public.team_members (id) on delete restrict,
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Written only by triggers (see 0004).
create table public.equipment_audit_logs (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references public.equipment (id) on delete cascade,
  action text not null check (action in ('created', 'updated')),
  changed_fields jsonb not null default '{}'::jsonb, -- { field: { "old": x, "new": y } }
  actor_id uuid references public.team_members (id) on delete set null,
  created_at timestamptz not null default now()
);

-- updated_at triggers --------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'team_members', 'vendors', 'customers', 'sites', 'contacts', 'equipment',
    'devices', 'work_orders', 'incidents', 'incident_comments', 'equipment_notes'
  ] loop
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end;
$$;

-- Indexes --------------------------------------------------------------------
-- Every foreign key (Postgres does not index them automatically)
create index on public.sites (customer_id);
create index on public.contacts (customer_id);
create index on public.contacts (site_id);
create index on public.equipment (site_id);
create index on public.devices (site_id);
create index on public.devices (equipment_id);
create index on public.work_orders (site_id);
create index on public.work_orders (equipment_id);
create index on public.work_orders (vendor_id);
create index on public.work_orders (assigned_to);
create index on public.work_orders (created_by);
create index on public.incidents (site_id);
create index on public.incidents (equipment_id);
create index on public.incidents (device_id);
create index on public.incidents (assigned_to);
create index on public.incidents (created_by);
create index on public.incident_comments (incident_id);
create index on public.incident_comments (author_id);
create index on public.incident_events (incident_id, created_at);
create index on public.incident_events (actor_id);
create index on public.equipment_notes (equipment_id);
create index on public.equipment_notes (author_id);
create index on public.equipment_audit_logs (equipment_id, created_at);
create index on public.equipment_audit_logs (actor_id);

-- Common filters
create index on public.equipment (category, status);
create index on public.devices (connectivity_status);
create index on public.work_orders (status, scheduled_for);
create index on public.incidents (status, severity);

-- Telemetry: "latest N readings of metric M for device D"
create index telemetry_device_metric_time_idx on public.telemetry (device_id, metric, recorded_at desc);

-- Fuzzy search (ILIKE '%term%') for global search
create index customers_name_trgm on public.customers using gin (name extensions.gin_trgm_ops);
create index sites_search_trgm on public.sites using gin ((code || ' ' || name) extensions.gin_trgm_ops);
create index equipment_search_trgm on public.equipment
  using gin ((name || ' ' || coalesce(serial_number, '')) extensions.gin_trgm_ops);
create index devices_search_trgm on public.devices
  using gin ((name || ' ' || external_id) extensions.gin_trgm_ops);
