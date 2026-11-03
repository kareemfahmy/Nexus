import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Icon } from '../../shared/ui/icon';
import { ToastContainer } from '../../shared/ui/toast';
import { COMPACT_LAYOUT_QUERY } from './breakpoints';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

const COLLAPSE_KEY = 'nx.sidebar.collapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Authenticated layout: sidebar + top bar + routed page.
 * Desktop (≥1024px): sidebar is always visible and can collapse to an icon rail.
 * Mobile/tablet: sidebar becomes an off-canvas drawer opened from the top bar.
 */
@Component({
  selector: 'nx-app-shell',
  imports: [RouterOutlet, Sidebar, Topbar, ToastContainer, Icon],
  host: {
    '[class.drawer-open]': 'drawerOpen()',
    '(document:keydown.escape)': 'drawerOpen.set(false)',
  },
  template: `
    <a class="skip-link" href="#main">Skip to main content</a>

    @if (drawerOpen()) {
      <div class="scrim" aria-hidden="true" (click)="drawerOpen.set(false)"></div>
    }

    <!-- On compact screens the closed drawer is inert: hidden links can't receive keyboard focus. -->
    <nx-sidebar
      class="sidebar"
      [collapsed]="collapsed() && !isCompact()"
      [inert]="isCompact() && !drawerOpen()"
      (toggleCollapsed)="toggleCollapsed()"
      (navigate)="drawerOpen.set(false)"
    />

    <div class="main-col">
      <nx-topbar (openMenu)="drawerOpen.set(true)" />

      @if (auth.isGuest()) {
        <div class="guest-banner" role="note">
          <nx-icon name="lock" [size]="14" />
          You're exploring a read-only demo with simulated data. Sign in with an operator account to
          make changes.
        </div>
      }

      <main id="main" tabindex="-1">
        <router-outlet />
      </main>
    </div>

    <nx-toast-container />
  `,
  styleUrl: './app-shell.scss',
})
export default class AppShell {
  protected readonly auth = inject(AuthService);
  protected readonly collapsed = signal(readCollapsed());
  protected readonly drawerOpen = signal(false);

  /** True below 1024px, where the sidebar becomes an off-canvas drawer (matches the SCSS breakpoint). */
  protected readonly isCompact = toSignal(
    inject(BreakpointObserver)
      .observe(COMPACT_LAYOUT_QUERY)
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );

  protected toggleCollapsed(): void {
    this.collapsed.update((v) => !v);
    try {
      localStorage.setItem(COLLAPSE_KEY, this.collapsed() ? '1' : '0');
    } catch {
      /* storage unavailable (private mode): preference just isn't remembered */
    }
  }
}
