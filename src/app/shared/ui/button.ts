import { Component, input } from '@angular/core';
import { Icon } from './icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Attribute component on a NATIVE <button>/<a>, so keyboard, form-submit and a11y semantics
 * come for free:  <button nxButton variant="primary" [loading]="saving()">Save</button>
 */
@Component({
  selector: 'button[nxButton], a[nxButton]',
  imports: [Icon],
  host: {
    class: 'nx-button',
    '[class]': '"nx-button--" + variant() + " nx-button--" + size()',
    '[attr.aria-busy]': 'loading() || null',
    '[attr.aria-disabled]': 'loading() || null',
    '[class.is-loading]': 'loading()',
  },
  template: `
    @if (loading()) {
      <nx-icon class="spin" name="spinner" [size]="14" />
    }
    <ng-content />
  `,
  styleUrl: './button.scss',
})
export class Button {
  readonly variant = input<ButtonVariant>('secondary');
  readonly size = input<ButtonSize>('md');
  readonly loading = input(false);
}
