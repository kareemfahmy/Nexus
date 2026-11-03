import { Routes } from '@angular/router';
import { authGuard, guestOnlyGuard } from './core/auth/auth.guards';

/**
 * Top-level routes. Every feature is lazy-loaded (`loadChildren` / `loadComponent`),
 * so its code is only downloaded when the user first visits it.
 *
 * `data.breadcrumb` feeds the breadcrumb trail in the top bar.
 */
export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestOnlyGuard],
    title: 'Sign in · Nexus',
    loadComponent: () => import('./features/auth/login-page'),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/app-shell'),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        data: { breadcrumb: 'Dashboard' },
        loadChildren: () => import('./features/dashboard/dashboard.routes'),
      },
      {
        path: 'customers',
        data: { breadcrumb: 'Customers' },
        loadChildren: () => import('./features/customers/customers.routes'),
      },
      {
        path: 'sites',
        data: { breadcrumb: 'Sites' },
        loadChildren: () => import('./features/sites/sites.routes'),
      },
      {
        path: 'equipment',
        data: { breadcrumb: 'Equipment' },
        loadChildren: () => import('./features/equipment/equipment.routes'),
      },
      {
        path: 'devices',
        data: { breadcrumb: 'Devices' },
        loadChildren: () => import('./features/devices/devices.routes'),
      },
      {
        path: 'work-orders',
        data: { breadcrumb: 'Work orders' },
        loadChildren: () => import('./features/work-orders/work-orders.routes'),
      },
      {
        path: 'incidents',
        data: { breadcrumb: 'Incidents' },
        loadChildren: () => import('./features/incidents/incidents.routes'),
      },
      {
        path: 'analytics',
        data: { breadcrumb: 'Analytics' },
        loadChildren: () => import('./features/analytics/analytics.routes'),
      },
      {
        path: 'forbidden',
        title: 'Read-only access · Nexus',
        data: { breadcrumb: 'Read-only' },
        loadComponent: () => import('./core/layout/forbidden-page'),
      },
      {
        path: '**',
        title: 'Not found · Nexus',
        data: { breadcrumb: 'Not found' },
        loadComponent: () => import('./core/layout/not-found-page'),
      },
    ],
  },
];
