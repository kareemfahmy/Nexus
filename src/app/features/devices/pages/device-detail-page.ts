import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import { describeError, isNotFound } from '../../../core/data/app-error';
import { BreadcrumbService } from '../../../core/layout/breadcrumb.service';
import { CATEGORY_LABEL, DEVICE_TYPE_LABEL } from '../../../shared/models/labels';
import { isStale, RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { Badge } from '../../../shared/ui/badge';
import { Button } from '../../../shared/ui/button';
import { EmptyState } from '../../../shared/ui/empty-state';
import { Icon } from '../../../shared/ui/icon';
import { KpiStat } from '../../../shared/ui/kpi-stat';
import { PageHeader } from '../../../shared/ui/page-header';
import { Skeleton } from '../../../shared/ui/skeleton';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { TelemetryPanel } from '../../telemetry/telemetry-panel';
import { ThermostatCard } from '../../telemetry/thermostat-card';
import { DeviceService } from '../data/device.service';

/** A device in context: what it is, where it is, what it's attached to, and what it reports. */
@Component({
  selector: 'nx-device-detail-page',
  imports: [
    DatePipe,
    RouterLink,
    RelativeTimePipe,
    Badge,
    Button,
    EmptyState,
    Icon,
    KpiStat,
    PageHeader,
    Skeleton,
    StatusBadge,
    TelemetryPanel,
    ThermostatCard,
  ],
  template: `
    @if (notFound()) {
      <nx-empty-state
        icon="search"
        heading="Device not found"
        [level]="1"
        message="It may have been removed, or the link is outdated."
      >
        <a nxButton routerLink="/devices">Back to devices</a>
      </nx-empty-state>
    } @else if (errorMessage()) {
      <nx-empty-state
        icon="server-crash"
        heading="Device could not be loaded"
        [message]="errorMessage()"
      >
        <button nxButton type="button" (click)="device.reload()">Try again</button>
      </nx-empty-state>
    } @else if (device.hasValue()) {
      @let d = device.value();
      <nx-page-header
        [title]="d.name"
        [subtitle]="typeLabel[d.device_type] + ' · ' + d.external_id"
      >
        <nx-status-badge actions [status]="d.connectivity_status" />
        @if (d.is_simulated) {
          <nx-badge actions tone="accent"><nx-icon name="flask" [size]="12" /> Simulated</nx-badge>
        }
      </nx-page-header>

      <section class="nx-kpis" aria-label="Device health">
        <nx-kpi-stat
          label="Last seen"
          [value]="d.last_seen_at | relativeTime"
          [hint]="d.last_seen_at ? ((d.last_seen_at | date: 'medium') ?? '') : ''"
          [tone]="stale() ? 'warning' : 'neutral'"
        />
        <nx-kpi-stat
          label="Health score"
          [value]="d.health_score"
          hint="0–100, from signal and error rates"
          [tone]="
            (d.health_score ?? 0) < 50
              ? 'danger'
              : (d.health_score ?? 0) < 80
                ? 'warning'
                : 'success'
          "
        />
        <nx-kpi-stat label="Firmware" [value]="d.firmware_version" />
        <nx-kpi-stat
          label="Data source"
          [value]="d.provider"
          [hint]="d.is_simulated ? 'Simulated readings' : 'Live integration'"
        />
      </section>

      <div class="nx-columns">
        <div class="nx-stack">
          @if (d.device_type === 'thermostat') {
            <nx-thermostat-card [deviceId]="d.id" />
          }
          <nx-telemetry-panel [deviceId]="d.id" [deviceType]="d.device_type" />
        </div>
        <aside class="nx-stack">
          <section class="nx-panel" aria-labelledby="where-heading">
            <h2 id="where-heading">Location</h2>
            <dl class="nx-dl">
              <dt>Site</dt>
              <dd>
                @if (d.site) {
                  <a [routerLink]="['/sites', d.site.id]">{{ d.site.code }}</a> {{ d.site.name }}
                }
              </dd>
              <dt>Equipment</dt>
              <dd>
                @if (d.equipment) {
                  <a [routerLink]="['/equipment', d.equipment.id]">{{ d.equipment.name }}</a>
                  <span class="nx-muted"> · {{ categoryLabel[d.equipment.category] }}</span>
                } @else {
                  <span class="nx-muted">Site-level device (not attached to equipment)</span>
                }
              </dd>
            </dl>
          </section>
          <section class="nx-panel" aria-labelledby="hw-heading">
            <h2 id="hw-heading">Hardware</h2>
            <dl class="nx-dl">
              <dt>Manufacturer</dt>
              <dd>{{ d.manufacturer ?? '–' }}</dd>
              <dt>Model</dt>
              <dd>{{ d.model ?? '–' }}</dd>
              <dt>Identifier</dt>
              <dd class="nx-mono">{{ d.external_id }}</dd>
              <dt>Installed</dt>
              <dd>{{ d.installed_on ? (d.installed_on | date: 'mediumDate') : '–' }}</dd>
            </dl>
          </section>
        </aside>
      </div>
    } @else {
      <nx-skeleton width="320px" height="28px" />
      <nx-skeleton height="320px" />
    }
  `,
})
export default class DeviceDetailPage {
  readonly id = input.required<string>();

  private readonly service = inject(DeviceService);
  private readonly crumbs = inject(BreadcrumbService);

  protected readonly device = resource({
    params: () => this.id(),
    loader: ({ params, abortSignal }) => this.service.getById(params, abortSignal),
  });

  protected readonly typeLabel = DEVICE_TYPE_LABEL;
  protected readonly categoryLabel = CATEGORY_LABEL;
  protected readonly notFound = computed(() => isNotFound(this.device.error()));
  protected readonly errorMessage = computed(() =>
    this.device.error() ? describeError(this.device.error()) : '',
  );
  protected readonly stale = computed(() =>
    this.device.hasValue() ? isStale(this.device.value().last_seen_at, 30) : false,
  );

  constructor() {
    effect(() => {
      if (this.device.hasValue())
        this.crumbs.setLabel(`/devices/${this.id()}`, this.device.value().name);
    });
  }
}
