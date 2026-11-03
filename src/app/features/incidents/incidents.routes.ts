import { Routes } from '@angular/router';

// Placeholder until Milestone 8. Real list/detail/form routes replace this.
export default [
  {
    path: '',
    title: 'Incidents · Nexus',
    loadComponent: () => import('../../shared/ui/placeholder-page'),
    data: {
      title: 'Incidents',
      milestone: '8',
      summary:
        'Technical incidents with severity, root cause, comments and a full activity timeline.',
    },
  },
] satisfies Routes;
