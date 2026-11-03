import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard, roleGuard } from './auth.guards';
import { AuthService } from './auth.service';

function setup(state: { authenticated: boolean; canOperate: boolean }) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: AuthService,
        useValue: {
          init: () => Promise.resolve(),
          isAuthenticated: () => state.authenticated,
          hasRole: () => state.canOperate,
        },
      },
    ],
  });
  return TestBed.inject(Router);
}

const route = {} as ActivatedRouteSnapshot;
const routerState = (url: string) => ({ url }) as RouterStateSnapshot;

describe('authGuard', () => {
  it('redirects signed-out users to /login and keeps the return URL', async () => {
    const router = setup({ authenticated: false, canOperate: false });
    const result = await TestBed.runInInjectionContext(() =>
      authGuard(route, routerState('/sites')),
    );
    expect(router.serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Fsites');
  });

  it('lets signed-in users through', async () => {
    setup({ authenticated: true, canOperate: false });
    const result = await TestBed.runInInjectionContext(() =>
      authGuard(route, routerState('/sites')),
    );
    expect(result).toBe(true);
  });
});

describe('roleGuard', () => {
  it('sends viewers to /forbidden', async () => {
    const router = setup({ authenticated: true, canOperate: false });
    const result = await TestBed.runInInjectionContext(() =>
      roleGuard('operator')(route, routerState('/x')),
    );
    expect(router.serializeUrl(result as UrlTree)).toBe('/forbidden');
  });
});
