import { inject, Service } from '@angular/core';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase.client';
import { ilikeAny } from '../../../core/data/list-query';
import type {
  Device,
  Equipment,
  EquipmentCategory,
  EquipmentInsert,
  EquipmentStatus,
  EquipmentUpdate,
  Json,
} from '../../../shared/models/db';

export interface EquipmentFilter {
  q: string;
  category: EquipmentCategory | '';
  status: EquipmentStatus | '';
  siteId: string;
}

export interface EquipmentRow {
  id: string;
  name: string;
  category: EquipmentCategory;
  status: EquipmentStatus;
  area_served: string | null;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  site_id: string;
  site: { code: string; name: string } | null;
  device_count: number;
}

export type EquipmentDetail = Equipment & {
  site: {
    id: string;
    code: string;
    name: string;
    customer: { id: string; name: string } | null;
  } | null;
};

export type LinkedDevice = Pick<
  Device,
  | 'id'
  | 'name'
  | 'device_type'
  | 'external_id'
  | 'connectivity_status'
  | 'last_seen_at'
  | 'health_score'
>;

/** One entry in the unified equipment timeline: a note someone wrote, or a recorded change. */
export type ActivityItem =
  | { kind: 'note'; id: string; at: string; who: string; body: string }
  | {
      kind: 'change';
      id: string;
      at: string;
      who: string;
      action: string;
      changes: Record<string, { old: Json; new: Json }>;
    };

export type SiteOption = { id: string; code: string; name: string };

/** Equipment reads/writes. The overview loads a whole filtered set (<= 1000) and groups it client-side. */
@Service()
export class EquipmentService {
  private readonly db = inject(SUPABASE_CLIENT);

  async list(filter: EquipmentFilter, signal?: AbortSignal): Promise<EquipmentRow[]> {
    let request = this.db
      .from('equipment')
      .select(
        'id, name, category, status, area_served, manufacturer, model, serial_number, site_id, site:sites(code, name), devices(count)',
      );
    if (filter.q)
      request = request.or(
        ilikeAny(['name', 'serial_number', 'manufacturer', 'model', 'area_served'], filter.q),
      );
    if (filter.category) request = request.eq('category', filter.category);
    if (filter.status) request = request.eq('status', filter.status);
    if (filter.siteId) request = request.eq('site_id', filter.siteId);
    request = request.order('name').limit(1000);
    if (signal) request = request.abortSignal(signal);
    const { data, error } = await request;
    if (error) throw error;
    return data.map(({ devices, ...e }) => ({ ...e, device_count: devices[0]?.count ?? 0 }));
  }

  async getById(id: string, signal?: AbortSignal): Promise<EquipmentDetail> {
    let request = this.db
      .from('equipment')
      .select('*, site:sites(id, code, name, customer:customers(id, name))')
      .eq('id', id);
    if (signal) request = request.abortSignal(signal);
    const { data, error } = await request.single();
    if (error) throw error;
    return data;
  }

  async devicesFor(equipmentId: string, signal?: AbortSignal): Promise<LinkedDevice[]> {
    let request = this.db
      .from('devices')
      .select('id, name, device_type, external_id, connectivity_status, last_seen_at, health_score')
      .eq('equipment_id', equipmentId)
      .order('device_type');
    if (signal) request = request.abortSignal(signal);
    const { data, error } = await request;
    if (error) throw error;
    return data;
  }

  /** Notes + audit trail merged into one newest-first timeline (two queries in parallel). */
  async activity(equipmentId: string, signal?: AbortSignal): Promise<ActivityItem[]> {
    let notesReq = this.db
      .from('equipment_notes')
      .select('id, body, created_at, author:team_members(full_name)')
      .eq('equipment_id', equipmentId);
    let auditReq = this.db
      .from('equipment_audit_logs')
      .select('id, action, changed_fields, created_at, actor:team_members(full_name)')
      .eq('equipment_id', equipmentId);
    if (signal) {
      notesReq = notesReq.abortSignal(signal);
      auditReq = auditReq.abortSignal(signal);
    }
    const [notes, audit] = await Promise.all([notesReq, auditReq]);
    if (notes.error) throw notes.error;
    if (audit.error) throw audit.error;

    const items: ActivityItem[] = [
      ...notes.data.map((n): ActivityItem => ({
        kind: 'note',
        id: n.id,
        at: n.created_at,
        who: n.author?.full_name ?? 'Unknown',
        body: n.body,
      })),
      ...audit.data.map((a): ActivityItem => ({
        kind: 'change',
        id: a.id,
        at: a.created_at,
        who: a.actor?.full_name ?? 'System',
        action: a.action,
        changes: (a.changed_fields ?? {}) as Record<string, { old: Json; new: Json }>,
      })),
    ];
    return items.sort((x, y) => y.at.localeCompare(x.at));
  }

  /** author_id is filled by the database default (current user's team member) and checked by RLS. */
  async addNote(equipmentId: string, body: string): Promise<void> {
    const { error } = await this.db
      .from('equipment_notes')
      .insert({ equipment_id: equipmentId, body });
    if (error) throw error;
  }

  async siteOptions(signal?: AbortSignal): Promise<SiteOption[]> {
    let request = this.db.from('sites').select('id, code, name').order('code');
    if (signal) request = request.abortSignal(signal);
    const { data, error } = await request;
    if (error) throw error;
    return data;
  }

  async create(values: EquipmentInsert): Promise<Equipment> {
    const { data, error } = await this.db.from('equipment').insert(values).select().single();
    if (error) throw error;
    return data;
  }

  async update(id: string, values: EquipmentUpdate): Promise<Equipment> {
    const { data, error } = await this.db
      .from('equipment')
      .update(values)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
