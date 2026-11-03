import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // Route params, query params and route data are delivered straight into component `input()`s.
      withComponentInputBinding(),
      // Restores scroll position on back/forward; scrolls to top on new pages.
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
      // Native View Transitions API for subtle page cross-fades (skipped under reduced motion via CSS).
      withViewTransitions(),
    ),
    // Read the stored Supabase session before the first navigation so guards don't flash /login.
    provideAppInitializer(() => inject(AuthService).init()),
  ],
};
