import { Routes } from '@angular/router';

// Placeholder until Milestone 9. Real list/detail/form routes replace this.
export default [
  {
    path: '',
    title: 'Analytics · Nexus',
    loadComponent: () => import('../../shared/ui/placeholder-page'),
    data: {
      title: 'Analytics',
      milestone: '9',
      summary:
        'Trends in connectivity, equipment reliability, work order throughput and incident resolution.',
    },
  },
] satisfies Routes;
