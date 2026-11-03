import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/auth.guards';
import { SiteWorkspaceStore } from './data/site-workspace.store';

const placeholder = (title: string, milestone: string, summary: string) => ({
  loadComponent: () => import('../../shared/ui/placeholder-page'),
  data: { breadcrumb: title, title, milestone, summary },
});

/**
 * /sites                     directory
 * /sites/new                 create (operator+), optional ?customer=<id>
 * /sites/:id/edit            edit (operator+)
 * /sites/:id/<tab>           workspace: SiteShell (header + tabs) around the tab content
 */
export default [
  { path: '', title: 'Sites · Nexus', loadComponent: () => import('./pages/site-list-page') },
  {
    path: 'new',
    title: 'New site · Nexus',
    canActivate: [roleGuard('operator')],
    data: { breadcrumb: 'New' },
    loadComponent: () => import('./pages/site-form-page'),
  },
  {
    path: ':id',
    data: { breadcrumb: ':record' },
    children: [
      {
        path: 'edit',
        title: 'Edit site · Nexus',
        canActivate: [roleGuard('operator')],
        data: { breadcrumb: 'Edit' },
        loadComponent: () => import('./pages/site-form-page'),
      },
      {
        path: '',
        loadComponent: () => import('./pages/site-shell'),
        // A new store per site visit, shared by the shell and every tab below it.
        providers: [SiteWorkspaceStore],
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'overview' },
          {
            path: 'overview',
            title: 'Site overview · Nexus',
            data: { breadcrumb: 'Overview' },
            loadComponent: () => import('./pages/site-overview-page'),
          },
          {
            path: 'details',
            title: 'Site details · Nexus',
            data: { breadcrumb: 'Details' },
            loadComponent: () => import('./pages/site-details-page'),
          },
          {
            path: 'equipment',
            title: 'Site equipment · Nexus',
            data: { breadcrumb: 'Equipment' },
            // same component as /equipment: it detects the SiteWorkspaceStore and scopes itself
            loadComponent: () => import('../equipment/pages/equipment-overview-page'),
          },
          {
            path: 'devices',
            title: 'Site devices · Nexus',
            data: { breadcrumb: 'Devices' },
            loadComponent: () => import('../devices/pages/device-list-page'),
          },
          {
            path: 'work-orders',
            ...placeholder('Work orders', '5', 'Maintenance jobs for this site.'),
          },
          {
            path: 'incidents',
            ...placeholder(
              'Incidents',
              '5',
              'Technical incidents for this site with their timeline.',
            ),
          },
        ],
      },
    ],
  },
] satisfies Routes;
