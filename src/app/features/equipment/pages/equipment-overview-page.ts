import { TitleCasePipe } from '@angular/common';
import { Component, computed, inject, input, linkedSignal, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { describeError } from '../../../core/data/app-error';
import { toText } from '../../../core/data/list-query';
import type { EquipmentCategory, EquipmentStatus } from '../../../shared/models/db';
import { CATEGORY_LABEL, CATEGORY_ORDER } from '../../../shared/models/labels';
import { Badge } from '../../../shared/ui/badge';
import { Button } from '../../../shared/ui/button';
import { DataTable, NxCell, TableColumn } from '../../../shared/ui/data-table';
import { EmptyState } from '../../../shared/ui/empty-state';
import { Icon } from '../../../shared/ui/icon';
import { PageHeader } from '../../../shared/ui/page-header';
import { SearchInput } from '../../../shared/ui/search-input';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { injectQueryParams } from '../../../shared/utils/query-params';
import { SiteWorkspaceStore } from '../../sites/data/site-workspace.store';
import { EquipmentRow, EquipmentService } from '../data/equipment.service';

const STATUSES: readonly EquipmentStatus[] = ['operational', 'degraded', 'down', 'decommissioned'];
const COLLAPSE_KEY = 'nx.equipment.collapsed';

interface Group {
  category: EquipmentCategory;
  label: string;
  rows: EquipmentRow[];
  down: number;
  degraded: number;
}

function readCollapsed(): EquipmentCategory[] {
  try {
    return JSON.parse(localStorage.getItem(COLLAPSE_KEY) ?? '[]') as EquipmentCategory[];
  } catch {
    return [];
  }
}

/**
 * Equipment overview grouped by category. FSG shows one wide table per category, each with its
 * own column picker; here every group shares the same columns and a header that answers
 * "how many, and how many have problems?" before you expand it.
 *
 * Used twice: /equipment (all sites) and /sites/:id/equipment. Inside a site workspace the
 * route-scoped SiteWorkspaceStore is found by DI; `{ optional: true }` returns null elsewhere.
 */
@Component({
  selector: 'nx-equipment-overview-page',
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
    SearchInput,
    StatusBadge,
  ],
  templateUrl: './equipment-overview-page.html',
  styleUrl: './equipment-overview-page.scss',
})
export default class EquipmentOverviewPage {
  private readonly service = inject(EquipmentService);
  private readonly siteStore = inject(SiteWorkspaceStore, { optional: true });
  protected readonly auth = inject(AuthService);
  private readonly setParams = injectQueryParams();

  readonly q = input('', { transform: toText });
  readonly category = input('', { transform: toText });
  readonly status = input('', { transform: toText });

  protected readonly inSite = this.siteStore !== null;
  protected readonly siteId = computed(() => this.siteStore?.siteId() ?? '');
  protected readonly statuses = STATUSES;
  protected readonly categories = CATEGORY_ORDER.map((c) => ({
    value: c,
    label: CATEGORY_LABEL[c],
  }));

  protected readonly columns = computed<TableColumn[]>(() => [
    { key: 'name', label: 'Equipment' },
    { key: 'area_served', label: 'Area', hideOnMobile: true },
    { key: 'model', label: 'Make / model', hideOnMobile: true },
    { key: 'serial_number', label: 'Serial', hideOnMobile: true, width: '130px' },
    ...(this.inSite ? [] : [{ key: 'site', label: 'Site', width: '110px' }]),
    { key: 'device_count', label: 'Devices', align: 'end' as const, width: '80px' },
    { key: 'status', label: 'Status', width: '140px' },
  ]);

  protected readonly result = resource({
    params: () => ({
      q: this.q(),
      category: (CATEGORY_ORDER as readonly string[]).includes(this.category())
        ? (this.category() as EquipmentCategory)
        : ('' as const),
      status: (STATUSES as readonly string[]).includes(this.status())
        ? (this.status() as EquipmentStatus)
        : ('' as const),
      siteId: this.siteId(),
    }),
    loader: ({ params, abortSignal }) => this.service.list(params, abortSignal),
  });

  private readonly rows = linkedSignal<EquipmentRow[] | undefined, EquipmentRow[]>({
    source: () => (this.result.hasValue() ? this.result.value() : undefined),
    computation: (next, prev) => next ?? prev?.value ?? [],
  });

  /** Pure derivation: rows -> ordered, non-empty category groups with problem counts. */
  protected readonly groups = computed<Group[]>(() =>
    CATEGORY_ORDER.map((category) => {
      const rows = this.rows().filter((r) => r.category === category);
      return {
        category,
        label: CATEGORY_LABEL[category],
        rows,
        down: rows.filter((r) => r.status === 'down').length,
        degraded: rows.filter((r) => r.status === 'degraded').length,
      };
    }).filter((g) => g.rows.length > 0),
  );

  protected readonly total = computed(() => this.rows().length);
  protected readonly collapsed = signal<ReadonlySet<EquipmentCategory>>(new Set(readCollapsed()));
  protected readonly errorMessage = computed(() =>
    this.result.error() ? describeError(this.result.error()) : '',
  );
  protected readonly hasFilters = computed(() => !!(this.q() || this.category() || this.status()));
  protected readonly link = (row: EquipmentRow) => ['/equipment', row.id];
  protected readonly newLink = computed(() => ({ site: this.siteId() || null }));

  protected toggle(category: EquipmentCategory): void {
    this.collapsed.update((set) => {
      const next = new Set(set);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      try {
        localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...next]));
      } catch {
        /* preference just isn't remembered */
      }
      return next;
    });
  }

  protected onSearch(q: string): void {
    void this.setParams({ q }, { replaceUrl: true });
  }

  protected onFilter(key: 'category' | 'status', value: string): void {
    void this.setParams({ [key]: value });
  }

  protected clearFilters(): void {
    void this.setParams({ q: null, category: null, status: null });
  }
}
