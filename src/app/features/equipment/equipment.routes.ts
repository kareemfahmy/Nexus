import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/auth.guards';

export default [
  {
    path: '',
    title: 'Equipment · Nexus',
    loadComponent: () => import('./pages/equipment-overview-page'),
  },
  {
    path: 'new',
    title: 'New equipment · Nexus',
    canActivate: [roleGuard('operator')],
    data: { breadcrumb: 'New' },
    loadComponent: () => import('./pages/equipment-form-page'),
  },
  {
    path: ':id',
    data: { breadcrumb: ':record' },
    children: [
      {
        path: '',
        title: 'Equipment · Nexus',
        loadComponent: () => import('./pages/equipment-detail-page'),
      },
      {
        path: 'edit',
        title: 'Edit equipment · Nexus',
        canActivate: [roleGuard('operator')],
        data: { breadcrumb: 'Edit' },
        loadComponent: () => import('./pages/equipment-form-page'),
      },
    ],
  },
] satisfies Routes;
