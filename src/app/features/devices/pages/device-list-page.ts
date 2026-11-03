import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, linkedSignal, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { describeError } from '../../../core/data/app-error';
import {
  DEFAULT_PAGE_SIZE,
  oneOf,
  Page,
  toDir,
  toPage,
  toText,
} from '../../../core/data/list-query';
import type { ConnectivityStatus, DeviceType } from '../../../shared/models/db';
import { DEVICE_TYPE_LABEL } from '../../../shared/models/labels';
import { isStale, RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { Button } from '../../../shared/ui/button';
import { DataTable, NxCell, SortChange, TableColumn } from '../../../shared/ui/data-table';
import { EmptyState } from '../../../shared/ui/empty-state';
import { PageHeader } from '../../../shared/ui/page-header';
import { Pagination } from '../../../shared/ui/pagination';
import { SearchInput } from '../../../shared/ui/search-input';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { injectQueryParams } from '../../../shared/utils/query-params';
import { SiteWorkspaceStore } from '../../sites/data/site-workspace.store';
import { DEVICE_SORTS, DeviceRow, DeviceService } from '../data/device.service';

const CONNECTIVITY: readonly ConnectivityStatus[] = ['online', 'warning', 'offline', 'unknown'];
const TYPES = Object.keys(DEVICE_TYPE_LABEL) as DeviceType[];

/**
 * Device inventory. The connectivity counts ARE the status filter (one control, two jobs), and
 * they reflect the current site/type scope so the numbers always add up to what you can see.
 * Reused as the Devices tab of a site workspace via the optional SiteWorkspaceStore.
 */
@Component({
  selector: 'nx-device-list-page',
  imports: [
    DatePipe,
    RouterLink,
    RelativeTimePipe,
    Button,
    DataTable,
    NxCell,
    EmptyState,
    PageHeader,
    Pagination,
    SearchInput,
    StatusBadge,
  ],
  templateUrl: './device-list-page.html',
  styleUrl: './device-list-page.scss',
})
export default class DeviceListPage {
  private readonly service = inject(DeviceService);
  private readonly siteStore = inject(SiteWorkspaceStore, { optional: true });
  private readonly setParams = injectQueryParams();

  readonly q = input('', { transform: toText });
  readonly type = input('', { transform: toText });
  readonly connectivity = input('', { transform: toText });
  readonly sort = input('', { transform: toText });
  readonly dir = input('asc' as const, { transform: toDir });
  readonly page = input(1, { transform: toPage });

  protected readonly inSite = this.siteStore !== null;
  protected readonly typeLabel = DEVICE_TYPE_LABEL;
  protected readonly types = TYPES;
  protected readonly connectivityOptions = CONNECTIVITY;

  protected readonly columns = computed<TableColumn[]>(() => [
    { key: 'name', label: 'Device', sortable: true },
    { key: 'device_type', label: 'Type', sortable: true, hideOnMobile: true },
    { key: 'external_id', label: 'Identifier', hideOnMobile: true },
    ...(this.inSite ? [] : [{ key: 'site', label: 'Site', width: '110px', hideOnMobile: true }]),
    { key: 'connectivity_status', label: 'Connectivity', sortable: true, width: '130px' },
    { key: 'last_seen_at', label: 'Last seen', sortable: true, width: '150px' },
    {
      key: 'health_score',
      label: 'Health',
      sortable: true,
      align: 'end' as const,
      width: '90px',
      hideOnMobile: true,
    },
  ]);

  protected readonly query = computed(() => ({
    q: this.q(),
    type: (TYPES as readonly string[]).includes(this.type())
      ? (this.type() as DeviceType)
      : ('' as const),
    connectivity: (CONNECTIVITY as readonly string[]).includes(this.connectivity())
      ? (this.connectivity() as ConnectivityStatus)
      : ('' as const),
    siteId: this.siteStore?.siteId() ?? '',
    sort: oneOf(this.sort(), DEVICE_SORTS, 'name'),
    dir: this.dir(),
    page: this.page(),
    pageSize: DEFAULT_PAGE_SIZE,
  }));

  protected readonly result = resource({
    params: () => this.query(),
    loader: ({ params, abortSignal }) => this.service.list(params, abortSignal),
  });

  /** Counts depend on scope (site, type) but NOT on the connectivity filter itself. */
  protected readonly counts = resource({
    params: () => ({ siteId: this.query().siteId, type: this.query().type }),
    loader: ({ params, abortSignal }) =>
      this.service.counts(params.siteId, params.type, abortSignal),
  });

  protected readonly page$ = linkedSignal<Page<DeviceRow> | undefined, Page<DeviceRow>>({
    source: () => (this.result.hasValue() ? this.result.value() : undefined),
    computation: (next, prev) => next ?? prev?.value ?? { rows: [], total: 0 },
  });

  protected readonly errorMessage = computed(() =>
    this.result.error() ? describeError(this.result.error()) : '',
  );
  protected readonly link = (row: DeviceRow) => ['/devices', row.id];
  protected readonly stale = (at: string | null) => isStale(at, 30);

  /** Typed lookup: cell-template rows are untyped, so map access goes through a typed method. */
  protected typeName(type: DeviceType): string {
    return DEVICE_TYPE_LABEL[type];
  }

  protected count(status: ConnectivityStatus): number | null {
    return this.counts.hasValue() ? this.counts.value()[status] : null;
  }

  protected onConnectivity(status: ConnectivityStatus): void {
    void this.setParams({
      connectivity: this.connectivity() === status ? null : status,
      page: null,
    });
  }

  protected onSearch(q: string): void {
    void this.setParams({ q, page: null }, { replaceUrl: true });
  }

  protected onType(type: string): void {
    void this.setParams({ type, page: null });
  }

  protected onSort({ sort, dir }: SortChange): void {
    void this.setParams({ sort, dir: dir === 'asc' ? null : dir, page: null });
  }

  protected onPage(page: number): void {
    void this.setParams({ page: page === 1 ? null : page });
  }
}
