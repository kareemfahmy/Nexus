import { DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Skeleton } from '../../../shared/ui/skeleton';
import { SiteWorkspaceStore } from '../data/site-workspace.store';

/** Every stored property of the site, for reference and support calls. */
@Component({
  selector: 'nx-site-details-page',
  imports: [DatePipe, DecimalPipe, TitleCasePipe, RouterLink, Skeleton],
  template: `
    @if (store.site.hasValue()) {
      @let site = store.site.value();
      <div class="nx-columns">
        <section class="nx-panel" aria-labelledby="props-heading">
          <h2 id="props-heading">Site properties</h2>
          <dl class="nx-dl">
            <dt>Site code</dt>
            <dd class="nx-mono">{{ site.code }}</dd>
            <dt>Name</dt>
            <dd>{{ site.name }}</dd>
            <dt>Status</dt>
            <dd>{{ site.status | titlecase }}</dd>
            <dt>Customer</dt>
            <dd>
              @if (site.customer) {
                <a [routerLink]="['/customers', site.customer.id]">{{ site.customer.name }}</a>
                <span class="nx-muted nx-mono"> {{ site.customer.account_number }}</span>
              }
            </dd>
            <dt>Address</dt>
            <dd>
              {{ site.address_line1 }}, {{ site.city }}, {{ site.state }} {{ site.postal_code }}
            </dd>
            <dt>Coordinates</dt>
            <dd class="nx-mono">
              {{
                site.latitude !== null
                  ? (site.latitude | number: '1.4-4') + ', ' + (site.longitude | number: '1.4-4')
                  : '–'
              }}
            </dd>
            <dt>Time zone</dt>
            <dd>{{ site.timezone }}</dd>
            <dt>Floor area</dt>
            <dd>{{ site.square_footage ? (site.square_footage | number) + ' sq ft' : '–' }}</dd>
            <dt>Opened</dt>
            <dd>{{ site.opened_on ? (site.opened_on | date: 'longDate') : '–' }}</dd>
          </dl>
        </section>
        <section class="nx-panel" aria-labelledby="record-heading">
          <h2 id="record-heading">Record</h2>
          <dl class="nx-dl">
            <dt>Created</dt>
            <dd>{{ site.created_at | date: 'medium' }}</dd>
            <dt>Last updated</dt>
            <dd>{{ site.updated_at | date: 'medium' }}</dd>
            <dt>Internal ID</dt>
            <dd class="nx-mono id">{{ site.id }}</dd>
          </dl>
        </section>
      </div>
    } @else {
      <nx-skeleton height="240px" />
    }
  `,
  styles: `
    .id {
      font-size: var(--text-xs);
    }
  `,
})
export default class SiteDetailsPage {
  protected readonly store = inject(SiteWorkspaceStore);
}
