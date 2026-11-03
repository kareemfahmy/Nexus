import { inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

type ParamValue = string | number | null | undefined;

/**
 * Returns a function that merges values into the current URL's query params.
 * `null`/`''` removes a param, which keeps URLs short and defaults implicit.
 * Must be called in an injection context (field initializer or constructor).
 *
 *   private readonly setParams = injectQueryParams();
 *   this.setParams({ q: 'grill', page: null });
 */
export function injectQueryParams() {
  const router = inject(Router);
  const route = inject(ActivatedRoute);
  return (patch: Record<string, ParamValue>, options: { replaceUrl?: boolean } = {}) => {
    const queryParams = Object.fromEntries(
      Object.entries(patch).map(([k, v]) => [k, v === '' || v === undefined ? null : v]),
    );
    return router.navigate([], {
      relativeTo: route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: options.replaceUrl ?? false,
    });
  };
}
