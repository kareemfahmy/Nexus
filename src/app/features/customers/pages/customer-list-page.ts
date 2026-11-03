import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, input, linkedSignal, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { describeError } from '../../../core/data/app-error';
import { DEFAULT_PAGE_SIZE, oneOf, toDir, toPage, toText } from '../../../core/data/list-query';
import type { CustomerStatus } from '../../../shared/models/db';
import { Button } from '../../../shared/ui/button';
import { DataTable, NxCell, SortChange, TableColumn } from '../../../shared/ui/data-table';
import { EmptyState } from '../../../shared/ui/empty-state';
import { Icon } from '../../../shared/ui/icon';
import { PageHeader } from '../../../shared/ui/page-header';
import { Pagination } from '../../../shared/ui/pagination';
import { SearchInput } from '../../../shared/ui/search-input';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { injectQueryParams } from '../../../shared/utils/query-params';
import { CUSTOMER_SORTS, CustomerListRow, CustomerService } from '../data/customer.service';

const STATUSES: readonly CustomerStatus[] = ['active', 'onboarding', 'inactive'];

/**
 * Customer directory.
 *
 * Data flow: URL query params --(withComponentInputBinding)--> input() signals
 *   --> `query` computed --> resource() params --> CustomerService.list() --> rows.
 * Changing a filter never touches the data directly: it updates the URL, and everything
 * downstream reacts. Back/forward, refresh and shared links therefore all "just work".
 */
@Component({
  selector: 'nx-customer-list-page',
  imports: [
    TitleCasePipe,
    RouterLink,
    Button,
    DataTable,
    NxCell,
    EmptyState,
    Icon,
    PageHeader,
    Pagination,
    SearchInput,
    StatusBadge,
  ],
  templateUrl: './customer-list-page.html',
})
export default class CustomerListPage {
  private readonly customers = inject(CustomerService);
  protected readonly auth = inject(AuthService);
  private readonly setParams = injectQueryParams();

  // Query params (undefined when absent; transforms apply defaults and validation)
  readonly q = input('', { transform: toText });
  readonly status = input('', { transform: toText });
  readonly sort = input('', { transform: toText });
  readonly dir = input('asc' as const, { transform: toDir });
  readonly page = input(1, { transform: toPage });

  protected readonly statuses = STATUSES;
  protected readonly columns: TableColumn[] = [
    { key: 'name', label: 'Customer', sortable: true },
    { key: 'account_number', label: 'Account', sortable: true, width: '130px' },
    { key: 'status', label: 'Status', sortable: true, width: '130px' },
    { key: 'industry', label: 'Industry', sortable: true, hideOnMobile: true },
    { key: 'billing_city', label: 'Billing city', sortable: true, hideOnMobile: true },
    { key: 'site_count', label: 'Sites', align: 'end', width: '80px' },
  ];

  protected readonly query = computed(() => ({
    q: this.q(),
    status: (STATUSES as readonly string[]).includes(this.status())
      ? (this.status() as CustomerStatus)
      : ('' as const),
    sort: oneOf(this.sort(), CUSTOMER_SORTS, 'name'),
    dir: this.dir(),
    page: this.page(),
    pageSize: DEFAULT_PAGE_SIZE,
  }));

  protected readonly result = resource({
    params: () => this.query(),
    loader: ({ params, abortSignal }) => this.customers.list(params, abortSignal),
  });

  /**
   * linkedSignal with access to its previous value: while the next page loads, resource.value()
   * is undefined, so we keep showing the previous rows (dimmed) instead of flashing a skeleton.
   */
  protected readonly page$ = linkedSignal<
    { rows: CustomerListRow[]; total: number } | undefined,
    { rows: CustomerListRow[]; total: number }
  >({
    source: () => (this.result.hasValue() ? this.result.value() : undefined),
    computation: (next, previous) => next ?? previous?.value ?? { rows: [], total: 0 },
  });

  protected readonly errorMessage = computed(() =>
    this.result.error() ? describeError(this.result.error()) : '',
  );

  protected readonly link = (row: CustomerListRow) => ['/customers', row.id];

  protected onSearch(q: string): void {
    void this.setParams({ q, page: null }, { replaceUrl: true });
  }

  protected onStatus(status: string): void {
    void this.setParams({ status, page: null });
  }

  protected onSort({ sort, dir }: SortChange): void {
    void this.setParams({ sort, dir: dir === 'asc' ? null : dir, page: null });
  }

  protected onPage(page: number): void {
    void this.setParams({ page: page === 1 ? null : page });
  }

  protected clearFilters(): void {
    void this.setParams({ q: null, status: null, page: null });
  }
}
