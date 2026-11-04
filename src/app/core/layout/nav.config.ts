import { IconName } from '../../shared/ui/icon';

export interface NavItem {
  label: string;
  path: string;
  icon: IconName;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Global navigation, grouped by job-to-be-done instead of FSG's flat 25-item list.
 * Hierarchy: Customer → Site → Equipment / Devices → Work orders / Incidents.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', path: '/dashboard', icon: 'dashboard' }],
  },
  {
    label: 'Accounts',
    items: [
      { label: 'Customers', path: '/customers', icon: 'building' },
      { label: 'Sites', path: '/sites', icon: 'pin' },
    ],
  },
  {
    label: 'Assets',
    items: [
      { label: 'Equipment', path: '/equipment', icon: 'equipment' },
      { label: 'Devices', path: '/devices', icon: 'cpu' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Work orders', path: '/work-orders', icon: 'work-order' },
      { label: 'Incidents', path: '/incidents', icon: 'incident' },
    ],
  },
];
