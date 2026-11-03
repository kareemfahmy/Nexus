import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/auth.guards';

/**
 * /customers            directory
 * /customers/new        create (operator+)
 * /customers/:id        detail       breadcrumb shows the customer name (':record')
 * /customers/:id/edit   edit (operator+)
 */
export default [
  {
    path: '',
    title: 'Customers · Nexus',
    loadComponent: () => import('./pages/customer-list-page'),
  },
  {
    path: 'new',
    title: 'New customer · Nexus',
    canActivate: [roleGuard('operator')],
    data: { breadcrumb: 'New' },
    loadComponent: () => import('./pages/customer-form-page'),
  },
  {
    path: ':id',
    data: { breadcrumb: ':record' },
    children: [
      {
        path: '',
        title: 'Customer · Nexus',
        loadComponent: () => import('./pages/customer-detail-page'),
      },
      {
        path: 'edit',
        title: 'Edit customer · Nexus',
        canActivate: [roleGuard('operator')],
        data: { breadcrumb: 'Edit' },
        loadComponent: () => import('./pages/customer-form-page'),
      },
    ],
  },
] satisfies Routes;
