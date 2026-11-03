import { Component, computed, input } from '@angular/core';
import {
  LucideActivity,
  LucideBuilding2,
  LucideChartColumn,
  LucideChevronDown,
  LucideChevronLeft,
  LucideChevronRight,
  LucideChevronUp,
  LucideChevronsUpDown,
  LucideChevronsLeft,
  LucideChevronsRight,
  LucideCircleAlert,
  LucideCircleCheck,
  LucideCircleDashed,
  LucideCircleHelp,
  LucideClipboardList,
  LucideConstruction,
  LucideCpu,
  LucideDynamicIcon,
  LucideFan,
  LucideFlaskConical,
  LucideInfo,
  LucideLayoutDashboard,
  LucideLoaderCircle,
  LucideLock,
  LucideLogOut,
  LucideMail,
  LucideMapPin,
  LucideMenu,
  LucidePencil,
  LucidePhone,
  LucidePlus,
  LucideSearch,
  LucideServerCrash,
  LucideSiren,
  LucideTrash,
  LucideTriangleAlert,
  LucideUsers,
  LucideWifi,
  LucideWifiOff,
  LucideWrench,
  LucideX,
} from '@lucide/angular';

/**
 * Central icon registry. Only icons listed here end up in the bundle (tree-shaking),
 * and templates/config can refer to icons by a stable string name.
 */
const ICONS = {
  activity: LucideActivity,
  alert: LucideCircleAlert,
  analytics: LucideChartColumn,
  building: LucideBuilding2,
  check: LucideCircleCheck,
  'chevron-down': LucideChevronDown,
  'chevron-left': LucideChevronLeft,
  'chevron-right': LucideChevronRight,
  'chevron-up': LucideChevronUp,
  'chevrons-up-down': LucideChevronsUpDown,
  'chevrons-left': LucideChevronsLeft,
  'chevrons-right': LucideChevronsRight,
  close: LucideX,
  construction: LucideConstruction,
  cpu: LucideCpu,
  dashboard: LucideLayoutDashboard,
  dashed: LucideCircleDashed,
  equipment: LucideFan,
  flask: LucideFlaskConical,
  help: LucideCircleHelp,
  incident: LucideSiren,
  info: LucideInfo,
  lock: LucideLock,
  'log-out': LucideLogOut,
  mail: LucideMail,
  menu: LucideMenu,
  pencil: LucidePencil,
  phone: LucidePhone,
  plus: LucidePlus,
  pin: LucideMapPin,
  search: LucideSearch,
  'server-crash': LucideServerCrash,
  spinner: LucideLoaderCircle,
  trash: LucideTrash,
  users: LucideUsers,
  warning: LucideTriangleAlert,
  wifi: LucideWifi,
  'wifi-off': LucideWifiOff,
  'work-order': LucideClipboardList,
  wrench: LucideWrench,
} as const;

export type IconName = keyof typeof ICONS;

/**
 * `<nx-icon name="wifi" />`
 * Decorative by default (aria-hidden). Pass `label` when the icon carries meaning on its own.
 */
@Component({
  selector: 'nx-icon',
  imports: [LucideDynamicIcon],
  host: {
    class: 'nx-icon',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() || null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
  },
  template: `<svg
    [lucideIcon]="icon()"
    [size]="size()"
    [strokeWidth]="1.75"
    aria-hidden="true"
  ></svg>`,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
      line-height: 0;
    }
  `,
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(16);
  readonly label = input<string>('');
  protected readonly icon = computed(() => ICONS[this.name()]);
}
