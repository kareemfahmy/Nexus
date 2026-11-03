import { booleanAttribute, Component, input } from '@angular/core';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent';

/** Compact label: `<nx-badge tone="warning" dot>Pending</nx-badge>`. Text is always visible. */
@Component({
  selector: 'nx-badge',
  host: { '[class]': '"tone-" + tone()' },
  template: `
    @if (dot()) {
      <span class="dot" aria-hidden="true"></span>
    }
    <ng-content />
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: var(--badge-height);
      padding: 0 var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--text-xs);
      font-weight: var(--weight-medium);
      line-height: 1;
      white-space: nowrap;
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }
    :host(.tone-success) {
      color: var(--status-success-fg);
      background: var(--status-success-bg);
    }
    :host(.tone-success) .dot {
      background: var(--status-success-dot);
    }
    :host(.tone-warning) {
      color: var(--status-warning-fg);
      background: var(--status-warning-bg);
    }
    :host(.tone-warning) .dot {
      background: var(--status-warning-dot);
    }
    :host(.tone-danger) {
      color: var(--status-danger-fg);
      background: var(--status-danger-bg);
    }
    :host(.tone-danger) .dot {
      background: var(--status-danger-dot);
    }
    :host(.tone-info) {
      color: var(--status-info-fg);
      background: var(--status-info-bg);
    }
    :host(.tone-info) .dot {
      background: var(--status-info-dot);
    }
    :host(.tone-neutral) {
      color: var(--status-neutral-fg);
      background: var(--status-neutral-bg);
    }
    :host(.tone-neutral) .dot {
      background: var(--status-neutral-dot);
    }
    :host(.tone-accent) {
      color: var(--color-accent-hover);
      background: var(--color-accent-subtle);
    }
  `,
})
export class Badge {
  readonly tone = input<BadgeTone>('neutral');
  readonly dot = input(false, { transform: booleanAttribute });
}
