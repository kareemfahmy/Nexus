import { Routes } from '@angular/router';

// Placeholder until Milestone 3. Real list/detail/form routes replace this.
export default [
  {
    path: '',
    title: 'Customers · Nexus',
    loadComponent: () => import('../../shared/ui/placeholder-page'),
    data: {
      title: 'Customers',
      milestone: '3',
      summary:
        'Customer directory with account, billing and contact details, and every site each customer owns.',
    },
  },
] satisfies Routes;
