import { Component, computed, inject, output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Badge } from '../../shared/ui/badge';
import { Icon } from '../../shared/ui/icon';
import { Breadcrumbs } from './breadcrumbs';

@Component({
  selector: 'nx-topbar',
  imports: [Breadcrumbs, Badge, Icon],
  template: `
    <button
      type="button"
      class="icon-btn menu"
      aria-label="Open navigation"
      (click)="openMenu.emit()"
    >
      <nx-icon name="menu" [size]="18" />
    </button>

    <nx-breadcrumbs class="crumbs" />

    <div class="right">
      <nx-badge tone="warning" class="demo-badge" title="All records and telemetry are simulated">
        <nx-icon name="flask" [size]="12" />
        Demo data
      </nx-badge>

      <div class="user">
        <span class="avatar" aria-hidden="true">{{ initial() }}</span>
        <span class="user-text">
          <span class="name">{{ auth.displayName() }}</span>
          <span class="role">{{ roleLabel() }}</span>
        </span>
      </div>

      <button
        type="button"
        class="icon-btn"
        aria-label="Sign out"
        title="Sign out"
        (click)="signOut()"
      >
        <nx-icon name="log-out" [size]="18" />
      </button>
    </div>
  `,
  styleUrl: './topbar.scss',
})
export class Topbar {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly openMenu = output<void>();

  protected readonly roleLabel = computed(() => {
    if (this.auth.isGuest()) return 'Read-only guest';
    const role = this.auth.role();
    return role.charAt(0).toUpperCase() + role.slice(1);
  });

  protected initial(): string {
    return this.auth.displayName().charAt(0).toUpperCase() || '?';
  }

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/login');
  }
}
