import { Routes } from '@angular/router';

export default [
  {
    path: '',
    title: 'Dashboard · Nexus',
    loadComponent: () => import('./pages/dashboard-page'),
  },
] satisfies Routes;
