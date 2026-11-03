/**
 * Domain type aliases derived from the generated Supabase schema.
 *
 * Features import these instead of hand-writing interfaces, so a schema change surfaces as a
 * compile error (after regenerating database.types.ts) rather than a runtime surprise.
 */
import type {
  Database,
  Enums,
  Tables,
  TablesInsert,
  TablesUpdate,
} from '../../core/supabase/database.types';

export type { Database };

// Rows
export type Customer = Tables<'customers'>;
export type Site = Tables<'sites'>;
export type Contact = Tables<'contacts'>;
export type Equipment = Tables<'equipment'>;
export type Device = Tables<'devices'>;
export type TelemetryReading = Tables<'telemetry'>;
export type WorkOrder = Tables<'work_orders'>;
export type Incident = Tables<'incidents'>;
export type IncidentComment = Tables<'incident_comments'>;
export type IncidentEvent = Tables<'incident_events'>;
export type EquipmentNote = Tables<'equipment_notes'>;
export type EquipmentAuditLog = Tables<'equipment_audit_logs'>;
export type TeamMember = Tables<'team_members'>;
export type Vendor = Tables<'vendors'>;

// Read models (views)
export type SiteSummary = Tables<'v_site_summary'>;
export type DashboardKpis = Tables<'v_dashboard_kpis'>;
export type DeviceLatestReading = Tables<'v_device_latest'>;

// Writes
export type CustomerInsert = TablesInsert<'customers'>;
export type CustomerUpdate = TablesUpdate<'customers'>;
export type SiteInsert = TablesInsert<'sites'>;
export type SiteUpdate = TablesUpdate<'sites'>;
export type EquipmentInsert = TablesInsert<'equipment'>;
export type EquipmentUpdate = TablesUpdate<'equipment'>;
export type WorkOrderInsert = TablesInsert<'work_orders'>;
export type WorkOrderUpdate = TablesUpdate<'work_orders'>;
export type IncidentInsert = TablesInsert<'incidents'>;
export type IncidentUpdate = TablesUpdate<'incidents'>;

// Enums
export type AppRole = Enums<'app_role'>;
export type CustomerStatus = Enums<'customer_status'>;
export type SiteStatus = Enums<'site_status'>;
export type EquipmentCategory = Enums<'equipment_category'>;
export type EquipmentStatus = Enums<'equipment_status'>;
export type DeviceType = Enums<'device_type'>;
export type ConnectivityStatus = Enums<'connectivity_status'>;
export type TelemetryMetric = Enums<'telemetry_metric'>;
export type WorkOrderStatus = Enums<'wo_status'>;
export type WorkOrderPriority = Enums<'wo_priority'>;
export type IncidentStatus = Enums<'incident_status'>;
export type IncidentSeverity = Enums<'incident_severity'>;
