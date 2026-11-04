import { inject, Service } from '@angular/core';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase.client';
import type {
  ConnectivityStatus,
  DashboardKpis,
  DeviceType,
  IncidentSeverity,
  IncidentStatus,
  WorkOrderPriority,
  WorkOrderStatus,
} from '../../../shared/models/db';

export interface AttentionDevice {
  id: string;
  name: string;
  device_type: DeviceType;
  connectivity_status: ConnectivityStatus;
  last_seen_at: string | null;
  site: { id: string; code: string };
}

export interface AttentionWorkOrder {
  id: string;
  display_id: string | null;
  title: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  scheduled_for: string | null;
  site: { id: string; code: string } | null;
}

export interface AttentionIncident {
  id: string;
  display_id: string | null;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  opened_at: string;
  site: { id: string; code: string } | null;
}

export interface WeeklyTrend {
  week: string;
  wo_created: number;
  wo_completed: number;
  incidents_opened: number;
  incidents_resolved: number;
}

const LIST_LIMIT = 8;

/**
 * Everything on the dashboard comes from the database: KPIs from v_dashboard_kpis, trends from
 * the ops_weekly_trend() function, attention lists from filtered queries. Nothing is hardcoded.
 */
@Service()
export class DashboardService {
  private readonly db = inject(SUPABASE_CLIENT);

  async kpis(signal?: AbortSignal): Promise<DashboardKpis> {
    let request = this.db.from('v_dashboard_kpis').select('*');
    if (signal) request = request.abortSignal(signal);
    const { data, error } = await request.single();
    if (error) throw error;
    return data;
  }

  /** Offline/warning devices at operating sites, longest-silent first. */
  async attentionDevices(signal?: AbortSignal): Promise<AttentionDevice[]> {
    // `!inner` turns the embed into an INNER JOIN so we can filter on the site's status.
    let request = this.db
      .from('devices')
      .select(
        'id, name, device_type, connectivity_status, last_seen_at, sites!inner(id, code, status)',
      )
      .in('connectivity_status', ['offline', 'warning'])
      .neq('sites.status', 'inactive') // filter on the joined table by its relation name
      .order('last_seen_at', { ascending: true, nullsFirst: false })
      .limit(LIST_LIMIT);
    if (signal) request = request.abortSignal(signal);
    const { data, error } = await request;
    if (error) throw error;
    return data.map(({ sites, ...d }) => ({ ...d, site: { id: sites.id, code: sites.code } }));
  }

  async overdueWorkOrders(signal?: AbortSignal): Promise<AttentionWorkOrder[]> {
    let request = this.db
      .from('work_orders')
      .select('id, display_id, title, priority, status, scheduled_for, site:sites(id, code)')
      .in('status', ['open', 'scheduled', 'in_progress'])
      .lt('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(LIST_LIMIT);
    if (signal) request = request.abortSignal(signal);
    const { data, error } = await request;
    if (error) throw error;
    return data;
  }

  async criticalIncidents(signal?: AbortSignal): Promise<AttentionIncident[]> {
    let request = this.db
      .from('incidents')
      .select('id, display_id, title, severity, status, opened_at, site:sites(id, code)')
      .in('status', ['open', 'in_progress', 'pending'])
      .in('severity', ['sev1', 'sev2'])
      .order('severity', { ascending: true })
      .order('opened_at', { ascending: true })
      .limit(LIST_LIMIT);
    if (signal) request = request.abortSignal(signal);
    const { data, error } = await request;
    if (error) throw error;
    return data;
  }

  async weeklyTrend(weeks: number, signal?: AbortSignal): Promise<WeeklyTrend[]> {
    let request = this.db.rpc('ops_weekly_trend', { p_weeks: weeks });
    if (signal) request = request.abortSignal(signal);
    const { data, error } = await request;
    if (error) throw error;
    return data;
  }
}
