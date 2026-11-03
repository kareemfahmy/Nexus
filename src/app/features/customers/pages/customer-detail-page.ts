import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, resource } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { describeError, isNotFound } from '../../../core/data/app-error';
import { BreadcrumbService } from '../../../core/layout/breadcrumb.service';
import type { SiteSummary } from '../../../shared/models/db';
import { Button } from '../../../shared/ui/button';
import { ConfirmService } from '../../../shared/ui/confirm-dialog';
import { DataTable, NxCell, TableColumn } from '../../../shared/ui/data-table';
import { EmptyState } from '../../../shared/ui/empty-state';
import { Icon } from '../../../shared/ui/icon';
import { KpiStat } from '../../../shared/ui/kpi-stat';
import { PageHeader } from '../../../shared/ui/page-header';
import { Skeleton } from '../../../shared/ui/skeleton';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { ToastService } from '../../../shared/ui/toast';
import { CustomerService } from '../data/customer.service';

/**
 * Customer overview: who they are, how their sites are doing, who to call.
 * Three independent resources load in parallel, each with its own loading/error state, so a slow
 * sites query never blocks the header.
 */
@Component({
  selector: 'nx-customer-detail-page',
  imports: [
    DatePipe,
    RouterLink,
    Button,
    DataTable,
    NxCell,
    EmptyState,
    Icon,
    KpiStat,
    PageHeader,
    Skeleton,
    StatusBadge,
  ],
  templateUrl: './customer-detail-page.html',
})
export default class CustomerDetailPage {
  /** `:id` route param, delivered by withComponentInputBinding() */
  readonly id = input.required<string>();

  private readonly service = inject(CustomerService);
  private readonly crumbs = inject(BreadcrumbService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly customer = resource({
    params: () => this.id(),
    loader: ({ params, abortSignal }) => this.service.getById(params, abortSignal),
  });
  protected readonly sites = resource({
    params: () => this.id(),
    loader: ({ params, abortSignal }) => this.service.sitesFor(params, abortSignal),
  });
  protected readonly contacts = resource({
    params: () => this.id(),
    loader: ({ params, abortSignal }) => this.service.contactsFor(params, abortSignal),
  });

  protected readonly notFound = computed(() => isNotFound(this.customer.error()));
  protected readonly errorMessage = computed(() =>
    this.customer.error() ? describeError(this.customer.error()) : '',
  );

  /** Portfolio health rolled up from the per-site summary view. */
  protected readonly totals = computed(() => {
    const rows: SiteSummary[] = this.sites.hasValue() ? this.sites.value() : [];
    const sum = (pick: (s: SiteSummary) => number | null) =>
      rows.reduce((acc, s) => acc + (pick(s) ?? 0), 0);
    return {
      sites: rows.length,
      devices: sum((s) => s.device_count),
      offline: sum((s) => s.devices_offline),
      openIncidents: sum((s) => s.open_incidents),
      openWorkOrders: sum((s) => s.open_work_orders),
      overdue: sum((s) => s.overdue_work_orders),
    };
  });

  protected readonly siteColumns: TableColumn[] = [
    { key: 'code', label: 'Site', width: '120px' },
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status', width: '120px' },
    { key: 'devices', label: 'Devices', hideOnMobile: true },
    { key: 'open_incidents', label: 'Open incidents', align: 'end', hideOnMobile: true },
    { key: 'open_work_orders', label: 'Open WOs', align: 'end', hideOnMobile: true },
  ];

  protected readonly siteLink = (row: SiteSummary) => ['/sites', row.id];

  constructor() {
    // Side effect on purpose: publish the record name to the breadcrumb trail (outside this component).
    effect(() => {
      if (this.customer.hasValue()) {
        this.crumbs.setLabel(`/customers/${this.id()}`, this.customer.value().name);
      }
    });
  }

  protected async remove(): Promise<void> {
    if (!this.customer.hasValue()) return;
    const c = this.customer.value();
    const ok = await this.confirm.ask({
      title: `Delete ${c.name}?`,
      message:
        'This permanently removes the customer and its contacts. Customers that still have sites cannot be deleted.',
      confirmLabel: 'Delete customer',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await this.service.remove(c.id);
      this.toast.success(`${c.name} was deleted.`);
      await this.router.navigateByUrl('/customers');
    } catch (err) {
      this.toast.error(describeError(err));
    }
  }
}
