import { Service, signal } from '@angular/core';

/**
 * Record names for breadcrumb segments whose route data says `breadcrumb: ':record'`.
 * Detail pages call `setLabel('/customers/<id>', 'Harbor Grill Group')` once their data loads;
 * until then the trail shows an ellipsis instead of a raw UUID.
 */
@Service()
export class BreadcrumbService {
  private readonly labels = signal<Readonly<Record<string, string>>>({});

  setLabel(url: string, label: string): void {
    this.labels.update((all) => (all[url] === label ? all : { ...all, [url]: label }));
  }

  labelFor(url: string): string | undefined {
    return this.labels()[url];
  }
}
