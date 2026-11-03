import { Routes } from '@angular/router';

// Placeholder until Milestone 4. Real list/detail/form routes replace this.
export default [
  {
    path: '',
    title: 'Equipment · Nexus',
    loadComponent: () => import('../../shared/ui/placeholder-page'),
    data: {
      title: 'Equipment',
      milestone: '4',
      summary:
        'Equipment overview grouped by category, with per-unit specs, linked devices and a unified activity timeline.',
    },
  },
] satisfies Routes;
