import { Component, computed, effect, inject, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { describeError, isNotFound } from '../../../core/data/app-error';
import { BreadcrumbService } from '../../../core/layout/breadcrumb.service';
import { Badge } from '../../../shared/ui/badge';
import { Button } from '../../../shared/ui/button';
import { ConfirmService } from '../../../shared/ui/confirm-dialog';
import { EmptyState } from '../../../shared/ui/empty-state';
import { Icon } from '../../../shared/ui/icon';
import { Skeleton } from '../../../shared/ui/skeleton';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { ToastService } from '../../../shared/ui/toast';
import { SiteService } from '../data/site.service';
import { SiteWorkspaceStore } from '../data/site-workspace.store';

/**
 * The site workspace: a persistent header plus tab navigation over child routes.
 * This replaces FSG's 25-item site sidebar. Moving between Overview / Equipment / Incidents
 * keeps the header (and its loaded data) in place; only the outlet below changes.
 *
 * Tabs are links (each tab is a URL you can bookmark or share), so they are a <nav> with
 * aria-current, not an ARIA tablist.
 */
@Component({
  selector: 'nx-site-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    Badge,
    Button,
    EmptyState,
    Icon,
    Skeleton,
    StatusBadge,
  ],
  templateUrl: './site-shell.html',
  styleUrl: './site-shell.scss',
})
export default class SiteShell {
  readonly id = input.required<string>();

  protected readonly store = inject(SiteWorkspaceStore);
  protected readonly auth = inject(AuthService);
  private readonly service = inject(SiteService);
  private readonly crumbs = inject(BreadcrumbService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly tabs = [
    { path: 'overview', label: 'Overview' },
    { path: 'equipment', label: 'Equipment' },
    { path: 'devices', label: 'Devices' },
    { path: 'work-orders', label: 'Work orders' },
    { path: 'incidents', label: 'Incidents' },
    { path: 'details', label: 'Details' },
  ];

  protected readonly notFound = computed(() => isNotFound(this.store.site.error()));
  protected readonly errorMessage = computed(() =>
    this.store.site.error() ? describeError(this.store.site.error()) : '',
  );
  protected readonly health = computed(() =>
    this.store.summary.hasValue() ? this.store.summary.value() : null,
  );

  constructor() {
    this.store.connect(this.id);
    effect(() => {
      if (this.store.site.hasValue()) {
        this.crumbs.setLabel(`/sites/${this.id()}`, this.store.site.value().code);
      }
    });
  }

  protected async remove(): Promise<void> {
    if (!this.store.site.hasValue()) return;
    const site = this.store.site.value();
    const ok = await this.confirm.ask({
      title: `Delete site ${site.code}?`,
      message:
        'Sites that still have equipment, devices, work orders or incidents cannot be deleted.',
      confirmLabel: 'Delete site',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await this.service.remove(site.id);
      this.toast.success(`Site ${site.code} was deleted.`);
      await this.router.navigateByUrl('/sites');
    } catch (err) {
      this.toast.error(describeError(err));
    }
  }
}
