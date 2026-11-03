import { Routes } from '@angular/router';

// Placeholder until Milestone 5. Real list/detail/form routes replace this.
export default [
  {
    path: '',
    title: 'Devices · Nexus',
    loadComponent: () => import('../../shared/ui/placeholder-page'),
    data: {
      title: 'Devices',
      milestone: '5',
      summary:
        'IoT device inventory with connectivity status, firmware, health and links to equipment.',
    },
  },
] satisfies Routes;
