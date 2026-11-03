import { Routes } from '@angular/router';

// Placeholder until Milestone 3. Real list/detail/form routes replace this.
export default [
  {
    path: '',
    title: 'Sites · Nexus',
    loadComponent: () => import('../../shared/ui/placeholder-page'),
    data: {
      title: 'Sites',
      milestone: '3',
      summary:
        'Site directory and a site workspace with overview, equipment, devices, work orders and incidents in one place.',
    },
  },
] satisfies Routes;
