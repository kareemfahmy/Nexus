import { Component, input } from '@angular/core';
import { Icon, IconName } from './icon';

/**
 * Empty / error / "not yet" state. Project a call-to-action button as content:
 * <nx-empty-state heading="No sites yet" message="..."><button nxButton>Add site</button></nx-empty-state>
 */
@Component({
  selector: 'nx-empty-state',
  imports: [Icon],
  template: `
    <div class="icon-wrap"><nx-icon [name]="icon()" [size]="20" /></div>
    <h2 class="heading">{{ heading() }}</h2>
    @if (message()) {
      <p class="message">{{ message() }}</p>
    }
    <div class="actions"><ng-content /></div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-9) var(--space-6);
      text-align: center;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
    }
    .icon-wrap {
      display: grid;
      place-items: center;
      width: var(--box-lg);
      height: var(--box-lg);
      margin-bottom: var(--space-1);
      border-radius: var(--radius-md);
      background: var(--color-surface-subtle);
      color: var(--color-text-secondary);
    }
    .heading {
      font-size: var(--text-md);
    }
    .message {
      max-width: 52ch;
      color: var(--color-text-secondary);
    }
    .actions:not(:empty) {
      display: flex;
      gap: var(--space-2);
      margin-top: var(--space-3);
    }
  `,
})
export class EmptyState {
  readonly icon = input<IconName>('info');
  readonly heading = input.required<string>();
  readonly message = input('');
}
