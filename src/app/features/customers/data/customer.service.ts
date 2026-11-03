import { inject, Service } from '@angular/core';
import { SUPABASE_CLIENT } from '../../../core/supabase/supabase.client';
import { ilikeAny, ListQuery, Page, pageRange } from '../../../core/data/list-query';
import type {
  Contact,
  Customer,
  CustomerInsert,
  CustomerStatus,
  CustomerUpdate,
  SiteSummary,
} from '../../../shared/models/db';

export const CUSTOMER_SORTS = [
  'name',
  'account_number',
  'status',
  'industry',
  'billing_city',
] as const;
export type CustomerSort = (typeof CUSTOMER_SORTS)[number];

export interface CustomerListQuery extends ListQuery {
  sort: CustomerSort;
  status: CustomerStatus | '';
}

export type CustomerListRow = Pick<
  Customer,
  'id' | 'name' | 'account_number' | 'status' | 'industry' | 'billing_city' | 'billing_state'
> & { site_count: number };

/**
 * All customer reads and writes. Components never touch Supabase directly: they call this
 * service (usually through `resource()`), which keeps queries typed, testable and in one place.
 * Every method throws the raw Supabase error; pages turn it into a message with describeError().
 */
@Service()
export class CustomerService {
  private readonly db = inject(SUPABASE_CLIENT);

  async list(query: CustomerListQuery, signal?: AbortSignal): Promise<Page<CustomerListRow>> {
    const [from, to] = pageRange(query);
    let request = this.db
      .from('customers')
      // `sites(count)` asks PostgREST to count related rows through the foreign key in one round trip
      .select(
        'id, name, account_number, status, industry, billing_city, billing_state, sites(count)',
        {
          count: 'exact',
        },
      );
    if (query.q) request = request.or(ilikeAny(['name', 'account_number', 'industry'], query.q));
    if (query.status) request = request.eq('status', query.status);
    request = request.order(query.sort, { ascending: query.dir === 'asc' }).range(from, to);
    if (signal) request = request.abortSignal(signal);

    const { data, error, count } = await request;
    if (error) throw error;
    return {
      total: count ?? 0,
      rows: data.map(({ sites, ...c }) => ({ ...c, site_count: sites[0]?.count ?? 0 })),
    };
  }

  async getById(id: string, signal?: AbortSignal): Promise<Customer> {
    let request = this.db.from('customers').select('*').eq('id', id);
    if (signal) request = request.abortSignal(signal);
    const { data, error } = await request.single();
    if (error) throw error;
    return data;
  }

  async sitesFor(customerId: string, signal?: AbortSignal): Promise<SiteSummary[]> {
    let request = this.db
      .from('v_site_summary')
      .select('*')
      .eq('customer_id', customerId)
      .order('code');
    if (signal) request = request.abortSignal(signal);
    const { data, error } = await request;
    if (error) throw error;
    return data;
  }

  /** Customer-level contacts (site contacts live on the site). Primary first. */
  async contactsFor(customerId: string, signal?: AbortSignal): Promise<Contact[]> {
    let request = this.db
      .from('contacts')
      .select('*')
      .eq('customer_id', customerId)
      .is('site_id', null)
      .order('is_primary', { ascending: false })
      .order('full_name');
    if (signal) request = request.abortSignal(signal);
    const { data, error } = await request;
    if (error) throw error;
    return data;
  }

  async create(values: CustomerInsert): Promise<Customer> {
    const { data, error } = await this.db.from('customers').insert(values).select().single();
    if (error) throw error;
    return data;
  }

  async update(id: string, values: CustomerUpdate): Promise<Customer> {
    const { data, error } = await this.db
      .from('customers')
      .update(values)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  /**
   * Admin only (RLS). If RLS hides the row, PostgREST deletes 0 rows WITHOUT an error,
   * so we ask for the deleted row back and treat "nothing returned" as a permission failure.
   */
  async remove(id: string): Promise<void> {
    const { data, error } = await this.db.from('customers').delete().eq('id', id).select('id');
    if (error) throw error;
    if (data.length === 0) throw { code: '42501', message: 'Delete not permitted' };
  }
}
