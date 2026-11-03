import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Icon } from '../../../shared/ui/icon';
import { KpiStat } from '../../../shared/ui/kpi-stat';
import { Skeleton } from '../../../shared/ui/skeleton';
import { SiteWorkspaceStore } from '../data/site-workspace.store';

/** First tab of a site: operational health at a glance, plus who to call and where it is. */
@Component({
  selector: 'nx-site-overview-page',
  imports: [DatePipe, DecimalPipe, Icon, KpiStat, Skeleton],
  template: `
    @if (summary(); as s) {
      <section class="nx-kpis" aria-label="Site health">
        <nx-kpi-stat
          label="Equipment"
          [value]="s.equipment_count"
          [hint]="s.equipment_down ? s.equipment_down + ' down' : ''"
          [tone]="s.equipment_down ? 'danger' : 'neutral'"
        />
        <nx-kpi-stat
          label="Devices online"
          [value]="s.devices_online + ' / ' + s.device_count"
          [tone]="s.devices_offline ? 'warning' : 'success'"
        />
        <nx-kpi-stat
          label="Devices offline"
          [value]="s.devices_offline"
          [tone]="s.devices_offline ? 'danger' : 'neutral'"
        />
        <nx-kpi-stat
          label="Open incidents"
          [value]="s.open_incidents"
          [hint]="s.critical_incidents ? s.critical_incidents + ' Sev 1–2' : ''"
          [tone]="s.critical_incidents ? 'danger' : s.open_incidents ? 'warning' : 'neutral'"
        />
        <nx-kpi-stat
          label="Open work orders"
          [value]="s.open_work_orders"
          [hint]="s.overdue_work_orders ? s.overdue_work_orders + ' overdue' : ''"
          [tone]="s.overdue_work_orders ? 'warning' : 'neutral'"
        />
      </section>
    } @else {
      <div class="nx-kpis">
        @for (i of [1, 2, 3, 4, 5]; track i) {
          <nx-skeleton height="72px" />
        }
      </div>
    }

    <div class="nx-columns">
      <section class="nx-panel" aria-labelledby="location-heading">
        <h2 id="location-heading">Location</h2>
        @if (store.site.hasValue()) {
          @let site = store.site.value();
          <dl class="nx-dl">
            <dt>Address</dt>
            <dd>
              {{ site.address_line1 }}<br />{{ site.city }}, {{ site.state }} {{ site.postal_code }}
            </dd>
            <dt>Time zone</dt>
            <dd>{{ site.timezone }}</dd>
            <dt>Floor area</dt>
            <dd>{{ site.square_footage ? (site.square_footage | number) + ' sq ft' : '–' }}</dd>
            <dt>Opened</dt>
            <dd>{{ site.opened_on ? (site.opened_on | date: 'mediumDate') : '–' }}</dd>
          </dl>
        } @else {
          <nx-skeleton height="96px" />
        }
      </section>

      <section class="nx-panel" aria-labelledby="contact-heading">
        <h2 id="contact-heading">Site contact</h2>
        @if (store.contacts.hasValue()) {
          @for (p of store.contacts.value(); track p.id) {
            <p class="name">{{ p.full_name }}</p>
            <p class="nx-muted">{{ p.job_title }}</p>
            @if (p.phone) {
              <a [href]="'tel:' + p.phone"><nx-icon name="phone" [size]="14" /> {{ p.phone }}</a>
            }
            @if (p.email) {
              <a [href]="'mailto:' + p.email"><nx-icon name="mail" [size]="14" /> {{ p.email }}</a>
            }
          } @empty {
            <p class="nx-muted">No site contact on file.</p>
          }
        } @else {
          <nx-skeleton height="64px" />
        }
      </section>
    </div>
  `,
  styles: `
    .name {
      font-weight: var(--weight-medium);
    }
    a {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      margin-top: var(--space-1);
      font-size: var(--text-sm);
    }
  `,
})
export default class SiteOverviewPage {
  protected readonly store = inject(SiteWorkspaceStore);
  protected readonly summary = computed(() =>
    this.store.summary.hasValue() ? this.store.summary.value() : null,
  );
}
