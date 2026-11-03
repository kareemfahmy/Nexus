-- Nexus 0001: extensions and enumerated types
-- Enums keep status values consistent between Postgres, generated TS types and the UI.

create extension if not exists pg_trgm with schema extensions;

create type public.app_role as enum ('viewer', 'operator', 'admin');
create type public.team as enum ('support', 'field_service', 'operations');

create type public.customer_status as enum ('active', 'onboarding', 'inactive');
create type public.site_status as enum ('active', 'onboarding', 'inactive');

create type public.equipment_category as enum ('hvac', 'cooler', 'freezer', 'make_up_air', 'exhaust', 'other');
create type public.equipment_status as enum ('operational', 'degraded', 'down', 'decommissioned');

create type public.device_type as enum (
  'thermostat', 'gateway', 'energy_meter', 'temp_sensor', 'humidity_sensor', 'controller', 'other'
);
create type public.connectivity_status as enum ('online', 'offline', 'warning', 'unknown');
create type public.telemetry_metric as enum (
  'room_temp_f', 'humidity_pct', 'cooling_setpoint_f', 'heating_setpoint_f', 'temperature_f', 'power_kw'
);

create type public.wo_status as enum ('open', 'scheduled', 'in_progress', 'completed', 'cancelled');
create type public.wo_priority as enum ('low', 'medium', 'high', 'urgent');

create type public.incident_status as enum ('open', 'in_progress', 'pending', 'resolved', 'closed');
create type public.incident_severity as enum ('sev1', 'sev2', 'sev3', 'sev4');
create type public.incident_event_type as enum (
  'created', 'status_change', 'assignment', 'severity_change'
);
