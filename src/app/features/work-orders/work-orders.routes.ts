import { Routes } from '@angular/router';

// Placeholder until Milestone 7. Real list/detail/form routes replace this.
export default [
  {
    path: '',
    title: 'Work orders · Nexus',
    loadComponent: () => import('../../shared/ui/placeholder-page'),
    data: {
      title: 'Work orders',
      milestone: '7',
      summary:
        'Maintenance jobs with scheduling, assignment, status workflow and overdue tracking.',
    },
  },
] satisfies Routes;
