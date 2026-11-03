import type { DeviceType, EquipmentCategory, TelemetryMetric } from './db';

/** Human labels for enum values. One place, so wording stays consistent across pages. */
export const CATEGORY_LABEL: Record<EquipmentCategory, string> = {
  hvac: 'HVAC',
  cooler: 'Coolers',
  freezer: 'Freezers',
  make_up_air: 'Make-up air units',
  exhaust: 'Exhaust',
  other: 'Other equipment',
};

/** Display order for grouped equipment (most operationally critical first). */
export const CATEGORY_ORDER: readonly EquipmentCategory[] = [
  'hvac',
  'cooler',
  'freezer',
  'make_up_air',
  'exhaust',
  'other',
];

export const DEVICE_TYPE_LABEL: Record<DeviceType, string> = {
  thermostat: 'Thermostat',
  gateway: 'Gateway',
  energy_meter: 'Energy meter',
  temp_sensor: 'Temperature sensor',
  humidity_sensor: 'Humidity sensor',
  controller: 'Controller',
  other: 'Other',
};

export interface MetricSpec {
  label: string;
  unit: string;
}

export const METRIC: Record<TelemetryMetric, MetricSpec> = {
  room_temp_f: { label: 'Room temperature', unit: '°F' },
  humidity_pct: { label: 'Humidity', unit: '%' },
  cooling_setpoint_f: { label: 'Cooling setpoint', unit: '°F' },
  heating_setpoint_f: { label: 'Heating setpoint', unit: '°F' },
  temperature_f: { label: 'Temperature', unit: '°F' },
  power_kw: { label: 'Power', unit: 'kW' },
};
