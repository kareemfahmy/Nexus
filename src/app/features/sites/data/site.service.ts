import { inject, Service } from '@angular/core';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase.client';
import { ilikeAny, ListQuery, Page, pageRange } from '../../../core/data/list-query';
import type {
  Contact,
  Customer,
  Site,
  SiteInsert,
  SiteStatus,
  SiteSummary,
  SiteUpdate,
} from '../../../shared/models/db';

export const SITE_SORTS = [
  'code',
  'name',
  'customer_name',
  'city',
  'status',
  'devices_offline',
  'open_incidents',
  'open_work_orders',
] as const;
export type SiteSort = (typeof SITE_SORTS)[number];

export interface SiteListQuery extends ListQuery {
  sort: SiteSort;
  status: SiteStatus | '';
  customerId: string;
}

export type SiteWithCustomer = Site & {
  customer: Pick<Customer, 'id' | 'name' | 'account_number' | 'status'> | null;
};

export type CustomerOption = Pick<Customer, 'id' | 'name'>;

/** Site reads/writes. Lists read the v_site_summary view so health counts come back in one query. */
@Service()
export class SiteService {
  private readonly db = inject(SUPABASE_CLIENT);

  async list(query: SiteListQuery, signal?: AbortSignal): Promise<Page<SiteSummary>> {
    const [from, to] = pageRange(query);
    let request = this.db.from('v_site_summary').select('*', { count: 'exact' });
    if (query.q) request = request.or(ilikeAny(['code', 'name', 'customer_name', 'city'], query.q));
    if (query.status) request = request.eq('status', query.status);
    if (query.customerId) request = request.eq('customer_id', query.customerId);
    // Secondary sort on code keeps paging stable when many rows tie (e.g. 0 open incidents).
    request = request
      .order(query.sort, { ascending: query.dir === 'asc' })
      .order('code', { ascending: true })
      .range(from, to);
    if (signal) request = request.abortSignal(signal);
    const { data, error, count } = await request;
    if (error) throw error;
    return { rows: data, total: count ?? 0 };
  }

  async getById(id: string, signal?: AbortSignal): Promise<SiteWithCustomer> {
    // Embedded resource: follow sites.customer_id and return the customer as a nested object.
    let request = this.db
      .from('sites')
      .select('*, customer:customers(id, name, account_number, status)')
      .eq('id', id);
    if (signal) request = request.abortSignal(signal);
    const { data, error } = await request.single();
    if (error) throw error;
    return data;
  }

  async summary(id: string, signal?: AbortSignal): Promise<SiteSummary | null> {
    let request = this.db.from('v_site_summary').select('*').eq('id', id);
    if (signal) request = request.abortSignal(signal);
    const { data, error } = await request.maybeSingle();
    if (error) throw error;
    return data;
  }

  async contactsFor(siteId: string, signal?: AbortSignal): Promise<Contact[]> {
    let request = this.db
      .from('contacts')
      .select('*')
      .eq('site_id', siteId)
      .order('is_primary', { ascending: false })
      .order('full_name');
    if (signal) request = request.abortSignal(signal);
    const { data, error } = await request;
    if (error) throw error;
    return data;
  }

  async customerOptions(signal?: AbortSignal): Promise<CustomerOption[]> {
    let request = this.db.from('customers').select('id, name').order('name');
    if (signal) request = request.abortSignal(signal);
    const { data, error } = await request;
    if (error) throw error;
    return data;
  }

  async create(values: SiteInsert): Promise<Site> {
    const { data, error } = await this.db.from('sites').insert(values).select().single();
    if (error) throw error;
    return data;
  }

  async update(id: string, values: SiteUpdate): Promise<Site> {
    const { data, error } = await this.db
      .from('sites')
      .update(values)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /** Admin only. Sites with equipment/devices/work orders are protected by FK `restrict`. */
  async remove(id: string): Promise<void> {
    const { data, error } = await this.db.from('sites').delete().eq('id', id).select('id');
    if (error) throw error;
    if (data.length === 0) throw { code: '42501', message: 'Delete not permitted' };
  }
}
