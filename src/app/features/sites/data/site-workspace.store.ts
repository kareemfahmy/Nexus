import { computed, inject, resource, Service, Signal, signal } from '@angular/core';
import { SiteService } from './site.service';

/**
 * State shared by every tab of ONE site workspace (/sites/:id/...).
 *
 * `autoProvided: false` means Angular will NOT create a global singleton. Instead the route
 * declares `providers: [SiteWorkspaceStore]`, so a fresh store is created when you enter a site
 * and destroyed when you leave it. Child tab components inject the same instance, so switching
 * tabs never re-fetches the header data.
 */
@Service({ autoProvided: false })
export class SiteWorkspaceStore {
  private readonly service = inject(SiteService);

  /** The shell hands over its `id` input signal; the store reads it reactively. */
  private readonly idSource = signal<Signal<string> | null>(null);
  readonly siteId = computed(() => this.idSource()?.());

  connect(id: Signal<string>): void {
    this.idSource.set(id);
  }

  // params returning undefined keeps the resource idle until connect() is called.
  readonly site = resource({
    params: () => this.siteId(),
    loader: ({ params, abortSignal }) => this.service.getById(params, abortSignal),
  });

  readonly summary = resource({
    params: () => this.siteId(),
    loader: ({ params, abortSignal }) => this.service.summary(params, abortSignal),
  });

  readonly contacts = resource({
    params: () => this.siteId(),
    loader: ({ params, abortSignal }) => this.service.contactsFor(params, abortSignal),
  });

  refresh(): void {
    this.site.reload();
    this.summary.reload();
    this.contacts.reload();
  }
}
