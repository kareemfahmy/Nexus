import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, input, linkedSignal, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { describeError } from '../../../core/data/app-error';
import {
  DEFAULT_PAGE_SIZE,
  oneOf,
  Page,
  toDir,
  toPage,
  toText,
} from '../../../core/data/list-query';
import type { SiteStatus, SiteSummary } from '../../../shared/models/db';
import { Badge } from '../../../shared/ui/badge';
import { Button } from '../../../shared/ui/button';
import { DataTable, NxCell, SortChange, TableColumn } from '../../../shared/ui/data-table';
import { EmptyState } from '../../../shared/ui/empty-state';
import { Icon } from '../../../shared/ui/icon';
import { PageHeader } from '../../../shared/ui/page-header';
import { Pagination } from '../../../shared/ui/pagination';
import { SearchInput } from '../../../shared/ui/search-input';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { injectQueryParams } from '../../../shared/utils/query-params';
import { SITE_SORTS, SiteService } from '../data/site.service';

const STATUSES: readonly SiteStatus[] = ['active', 'onboarding', 'inactive'];

/** Site directory with health columns, so problems are visible before opening a site. */
@Component({
  selector: 'nx-site-list-page',
  imports: [
    TitleCasePipe,
    RouterLink,
    Badge,
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
  templateUrl: './site-list-page.html',
})
export default class SiteListPage {
  private readonly sites = inject(SiteService);
  protected readonly auth = inject(AuthService);
  private readonly setParams = injectQueryParams();

  readonly q = input('', { transform: toText });
  readonly status = input('', { transform: toText });
  readonly customer = input('', { transform: toText });
  readonly sort = input('', { transform: toText });
  readonly dir = input('asc' as const, { transform: toDir });
  readonly page = input(1, { transform: toPage });

  protected readonly statuses = STATUSES;
  protected readonly columns: TableColumn[] = [
    { key: 'code', label: 'Site', sortable: true, width: '120px' },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'customer_name', label: 'Customer', sortable: true, hideOnMobile: true },
    { key: 'city', label: 'Location', sortable: true, hideOnMobile: true },
    { key: 'status', label: 'Status', sortable: true, width: '120px' },
    { key: 'devices_offline', label: 'Devices', sortable: true, hideOnMobile: true },
    { key: 'open_incidents', label: 'Incidents', sortable: true, align: 'end', hideOnMobile: true },
    {
      key: 'open_work_orders',
      label: 'Work orders',
      sortable: true,
      align: 'end',
      hideOnMobile: true,
    },
  ];

  protected readonly customerOptions = resource({
    loader: ({ abortSignal }) => this.sites.customerOptions(abortSignal),
  });

  protected readonly query = computed(() => ({
    q: this.q(),
    status: (STATUSES as readonly string[]).includes(this.status())
      ? (this.status() as SiteStatus)
      : ('' as const),
    customerId: this.customer(),
    sort: oneOf(this.sort(), SITE_SORTS, 'code'),
    dir: this.dir(),
    page: this.page(),
    pageSize: DEFAULT_PAGE_SIZE,
  }));

  protected readonly result = resource({
    params: () => this.query(),
    loader: ({ params, abortSignal }) => this.sites.list(params, abortSignal),
  });

  protected readonly page$ = linkedSignal<Page<SiteSummary> | undefined, Page<SiteSummary>>({
    source: () => (this.result.hasValue() ? this.result.value() : undefined),
    computation: (next, previous) => next ?? previous?.value ?? { rows: [], total: 0 },
  });

  protected readonly errorMessage = computed(() =>
    this.result.error() ? describeError(this.result.error()) : '',
  );

  protected readonly hasFilters = computed(() => !!(this.q() || this.status() || this.customer()));
  protected readonly link = (row: SiteSummary) => ['/sites', row.id];

  protected onSearch(q: string): void {
    void this.setParams({ q, page: null }, { replaceUrl: true });
  }

  protected onFilter(key: 'status' | 'customer', value: string): void {
    void this.setParams({ [key]: value, page: null });
  }

  protected onSort({ sort, dir }: SortChange): void {
    void this.setParams({ sort, dir: dir === 'asc' ? null : dir, page: null });
  }

  protected onPage(page: number): void {
    void this.setParams({ page: page === 1 ? null : page });
  }

  protected clearFilters(): void {
    void this.setParams({ q: null, status: null, customer: null, page: null });
  }
}
