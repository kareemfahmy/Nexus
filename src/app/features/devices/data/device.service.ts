import { inject, Service } from '@angular/core';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase.client';
import { ilikeAny, ListQuery, Page, pageRange } from '../../../core/data/list-query';
import type {
  ConnectivityStatus,
  Device,
  DeviceType,
  EquipmentCategory,
} from '../../../shared/models/db';

export const DEVICE_SORTS = [
  'name',
  'device_type',
  'connectivity_status',
  'last_seen_at',
  'health_score',
] as const;
export type DeviceSort = (typeof DEVICE_SORTS)[number];

export interface DeviceListQuery extends ListQuery {
  sort: DeviceSort;
  type: DeviceType | '';
  connectivity: ConnectivityStatus | '';
  siteId: string;
}

export type DeviceRow = Pick<
  Device,
  | 'id'
  | 'name'
  | 'device_type'
  | 'external_id'
  | 'connectivity_status'
  | 'last_seen_at'
  | 'health_score'
  | 'firmware_version'
  | 'site_id'
  | 'equipment_id'
> & { site: { code: string } | null; equipment: { name: string } | null };

export type DeviceDetail = Device & {
  site: { id: string; code: string; name: string } | null;
  equipment: { id: string; name: string; category: EquipmentCategory } | null;
};

export type ConnectivityCounts = Record<ConnectivityStatus, number>;

const STATUSES: readonly ConnectivityStatus[] = ['online', 'warning', 'offline', 'unknown'];

@Service()
export class DeviceService {
  private readonly db = inject(SUPABASE_CLIENT);

  async list(query: DeviceListQuery, signal?: AbortSignal): Promise<Page<DeviceRow>> {
    const [from, to] = pageRange(query);
    let request = this.db
      .from('devices')
      .select(
        'id, name, device_type, external_id, connectivity_status, last_seen_at, health_score, firmware_version, site_id, equipment_id, site:sites(code), equipment:equipment(name)',
        { count: 'exact' },
      );
    if (query.q)
      request = request.or(ilikeAny(['name', 'external_id', 'manufacturer', 'model'], query.q));
    if (query.type) request = request.eq('device_type', query.type);
    if (query.connectivity) request = request.eq('connectivity_status', query.connectivity);
    if (query.siteId) request = request.eq('site_id', query.siteId);
    request = request
      .order(query.sort, { ascending: query.dir === 'asc', nullsFirst: false })
      .order('name')
      .range(from, to);
    if (signal) request = request.abortSignal(signal);
    const { data, error, count } = await request;
    if (error) throw error;
    return { rows: data, total: count ?? 0 };
  }

  /**
   * Counts per connectivity status for the filter chips. PostgREST has no GROUP BY, so this runs
   * four tiny `head: true` requests (count only, no rows) in parallel.
   */
  async counts(
    siteId: string,
    type: DeviceType | '',
    signal?: AbortSignal,
  ): Promise<ConnectivityCounts> {
    const results = await Promise.all(
      STATUSES.map(async (status) => {
        let request = this.db
          .from('devices')
          .select('id', { count: 'exact', head: true })
          .eq('connectivity_status', status);
        if (siteId) request = request.eq('site_id', siteId);
        if (type) request = request.eq('device_type', type);
        if (signal) request = request.abortSignal(signal);
        const { count, error } = await request;
        if (error) throw error;
        return [status, count ?? 0] as const;
      }),
    );
    return Object.fromEntries(results) as ConnectivityCounts;
  }

  async getById(id: string, signal?: AbortSignal): Promise<DeviceDetail> {
    let request = this.db
      .from('devices')
      .select('*, site:sites(id, code, name), equipment:equipment(id, name, category)')
      .eq('id', id);
    if (signal) request = request.abortSignal(signal);
    const { data, error } = await request.single();
    if (error) throw error;
    return data;
  }
}
