import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppRole, AuthService } from './auth.service';

/**
 * Functional guards (the modern replacement for class-based guards).
 * They run inside an injection context, so `inject()` works directly.
 * Returning a UrlTree redirects instead of just blocking.
 */

/** Only signed-in users (guest or real) may enter the app shell. */
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.init();
  return auth.isAuthenticated()
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

/** Keeps signed-in users away from the login page. */
export const guestOnlyGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.init();
  return auth.isAuthenticated() ? router.createUrlTree(['/dashboard']) : true;
};

/**
 * Factory guard for write routes (create/edit). UX only: RLS still rejects the write
 * even if someone bypasses this in the browser.
 */
export const roleGuard =
  (min: AppRole): CanActivateFn =>
  async () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    await auth.init();
    return auth.hasRole(min) ? true : router.createUrlTree(['/forbidden']);
  };
