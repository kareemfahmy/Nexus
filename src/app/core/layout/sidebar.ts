import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icon } from '../../shared/ui/icon';
import { NAV_GROUPS } from './nav.config';

@Component({
  selector: 'nx-sidebar',
  imports: [RouterLink, RouterLinkActive, Icon],
  host: { '[class.collapsed]': 'collapsed()' },
  template: `
    <div class="brand">
      <span class="logo" aria-hidden="true">N</span>
      @if (!collapsed()) {
        <span class="wordmark">Nexus</span>
      }
    </div>

    <nav aria-label="Main">
      @for (group of groups; track group.label) {
        <div class="group">
          @if (!collapsed()) {
            <p class="group-label">{{ group.label }}</p>
          }
          <ul role="list">
            @for (item of group.items; track item.path) {
              <li>
                <a
                  [routerLink]="item.path"
                  routerLinkActive="active"
                  ariaCurrentWhenActive="page"
                  [attr.title]="collapsed() ? item.label : null"
                  [attr.aria-label]="collapsed() ? item.label : null"
                  (click)="navigate.emit()"
                >
                  <nx-icon [name]="item.icon" [size]="18" />
                  @if (!collapsed()) {
                    <span>{{ item.label }}</span>
                  }
                </a>
              </li>
            }
          </ul>
        </div>
      }
    </nav>

    <button
      type="button"
      class="collapse-toggle"
      [attr.aria-label]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
      [attr.aria-expanded]="!collapsed()"
      (click)="toggleCollapsed.emit()"
    >
      <nx-icon [name]="collapsed() ? 'chevrons-right' : 'chevrons-left'" />
      @if (!collapsed()) {
        <span>Collapse</span>
      }
    </button>
  `,
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  readonly collapsed = input(false);
  /** Emitted on link click so the mobile drawer can close itself. */
  readonly navigate = output<void>();
  readonly toggleCollapsed = output<void>();
  protected readonly groups = NAV_GROUPS;
}
