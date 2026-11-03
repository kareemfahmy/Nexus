import { Routes } from '@angular/router';

// Placeholder until Milestone 9. Real list/detail/form routes replace this.
export default [
  {
    path: '',
    title: 'Dashboard · Nexus',
    loadComponent: () => import('../../shared/ui/placeholder-page'),
    data: {
      title: 'Dashboard',
      milestone: '9',
      summary:
        'Operational overview: device connectivity, overdue work orders and open incidents, calculated from live database records.',
    },
  },
] satisfies Routes;
