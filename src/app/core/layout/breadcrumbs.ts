import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { Icon } from '../../shared/ui/icon';
import { BreadcrumbService } from './breadcrumb.service';

interface Crumb {
  label: string;
  url: string;
}

/**
 * Builds the trail from `data.breadcrumb` on each active route segment.
 * Router events are an Observable; `toSignal()` bridges them into the signal world.
 * (Record names, e.g. a site code, are added in M3 by setting breadcrumb data dynamically.)
 */
@Component({
  selector: 'nx-breadcrumbs',
  imports: [RouterLink, Icon],
  template: `
    <nav aria-label="Breadcrumb">
      <ol>
        @for (crumb of crumbs(); track crumb.url; let last = $last) {
          <li>
            @if (last) {
              <span aria-current="page">{{ crumb.label }}</span>
            } @else {
              <a [routerLink]="crumb.url">{{ crumb.label }}</a>
              <nx-icon name="chevron-right" [size]="14" />
            }
          </li>
        }
      </ol>
    </nav>
  `,
  styles: `
    ol {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      margin: 0;
      padding: 0;
      list-style: none;
      font-size: var(--text-sm);
      min-width: 0;
    }
    li {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      min-width: 0;
      color: var(--color-text-muted);
    }
    a {
      color: var(--color-text-secondary);
    }
    [aria-current] {
      color: var(--color-text);
      font-weight: var(--weight-medium);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,
})
export class Breadcrumbs {
  private readonly router = inject(Router);
  private readonly names = inject(BreadcrumbService);

  private readonly navEnd = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.routerState.snapshot.root),
    ),
    { initialValue: this.router.routerState.snapshot.root },
  );

  protected readonly crumbs = computed<Crumb[]>(() => {
    const crumbs: Crumb[] = [];
    let route: ActivatedRouteSnapshot | null = this.navEnd();
    let url = '';
    while (route) {
      const segment = route.url.map((s) => s.path).join('/');
      if (segment) url += `/${segment}`;
      const raw = route.routeConfig?.data?.['breadcrumb'];
      // ':record' = name of the record in this URL, supplied by the detail page once loaded
      const label = raw === ':record' ? (this.names.labelFor(url) ?? '…') : raw;
      if (typeof label === 'string' && segment && crumbs.at(-1)?.url !== url) {
        crumbs.push({ label, url });
      } else if (typeof label === 'string' && !segment && crumbs.length === 0) {
        crumbs.push({ label, url: url || '/' });
      }
      route = route.firstChild;
    }
    return crumbs;
  });
}
