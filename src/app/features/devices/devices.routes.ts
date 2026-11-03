import { Routes } from '@angular/router';

export default [
  { path: '', title: 'Devices · Nexus', loadComponent: () => import('./pages/device-list-page') },
  {
    path: ':id',
    title: 'Device · Nexus',
    data: { breadcrumb: ':record' },
    loadComponent: () => import('./pages/device-detail-page'),
  },
] satisfies Routes;
