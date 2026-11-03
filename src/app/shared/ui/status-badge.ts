import { Component, computed, input } from '@angular/core';
import { Badge, BadgeTone } from './badge';
import { Icon, IconName } from './icon';

interface StatusSpec {
  tone: BadgeTone;
  label: string;
  icon?: IconName;
}

/**
 * ONE mapping from every status enum value in Nexus to tone + label + icon.
 * Keeps status styling identical across devices, equipment, work orders and incidents,
 * and guarantees colour is never the only signal (dot + optional icon + text).
 */
const STATUS: Record<string, StatusSpec> = {
  // Device connectivity
  online: { tone: 'success', label: 'Online', icon: 'wifi' },
  offline: { tone: 'danger', label: 'Offline', icon: 'wifi-off' },
  warning: { tone: 'warning', label: 'Warning', icon: 'warning' },
  unknown: { tone: 'neutral', label: 'Unknown', icon: 'help' },
  // Equipment
  operational: { tone: 'success', label: 'Operational' },
  degraded: { tone: 'warning', label: 'Degraded' },
  down: { tone: 'danger', label: 'Down' },
  decommissioned: { tone: 'neutral', label: 'Decommissioned' },
  // Customers / sites
  active: { tone: 'success', label: 'Active' },
  inactive: { tone: 'neutral', label: 'Inactive' },
  onboarding: { tone: 'info', label: 'Onboarding' },
  // Work orders
  open: { tone: 'info', label: 'Open' },
  scheduled: { tone: 'info', label: 'Scheduled' },
  in_progress: { tone: 'accent', label: 'In progress' },
  completed: { tone: 'success', label: 'Completed' },
  cancelled: { tone: 'neutral', label: 'Cancelled' },
  // Incidents
  pending: { tone: 'warning', label: 'Pending' },
  resolved: { tone: 'success', label: 'Resolved' },
  closed: { tone: 'neutral', label: 'Closed' },
  // Severity
  sev1: { tone: 'danger', label: 'Sev 1', icon: 'alert' },
  sev2: { tone: 'danger', label: 'Sev 2' },
  sev3: { tone: 'warning', label: 'Sev 3' },
  sev4: { tone: 'neutral', label: 'Sev 4' },
};

/** `<nx-status-badge status="offline" />` */
@Component({
  selector: 'nx-status-badge',
  imports: [Badge, Icon],
  template: `
    <nx-badge [tone]="spec().tone" [dot]="!spec().icon || !showIcon()">
      @if (spec().icon && showIcon()) {
        <nx-icon [name]="spec().icon!" [size]="12" />
      }
      {{ spec().label }}
    </nx-badge>
  `,
})
export class StatusBadge {
  readonly status = input.required<string>();
  readonly showIcon = input(true);
  protected readonly spec = computed<StatusSpec>(
    () =>
      STATUS[this.status()] ?? {
        tone: 'neutral',
        label: this.status().replaceAll('_', ' '),
      },
  );
}
