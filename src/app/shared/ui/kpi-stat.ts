import { Component, input } from '@angular/core';

export type KpiTone = 'neutral' | 'success' | 'warning' | 'danger';

/** Compact metric: small label, tabular value, optional context line. Deliberately not oversized. */
@Component({
  selector: 'nx-kpi-stat',
  host: { '[class]': '"tone-" + tone()' },
  template: `
    <p class="label">{{ label() }}</p>
    <p class="value nx-tabular">{{ value() ?? '–' }}</p>
    @if (hint()) {
      <p class="hint">{{ hint() }}</p>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: var(--space-3) var(--space-4);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
    }
    .label {
      font-size: var(--text-sm);
      color: var(--color-text-secondary);
    }
    .value {
      margin-top: var(--space-1);
      font-size: var(--text-lg);
      font-weight: var(--weight-semibold);
    }
    .hint {
      font-size: var(--text-xs);
      color: var(--color-text-muted);
    }
    :host(.tone-success) .value {
      color: var(--status-success-fg);
    }
    :host(.tone-warning) .value {
      color: var(--status-warning-fg);
    }
    :host(.tone-danger) .value {
      color: var(--status-danger-fg);
    }
  `,
})
export class KpiStat {
  readonly label = input.required<string>();
  readonly value = input<string | number | null>(null);
  readonly hint = input('');
  readonly tone = input<KpiTone>('neutral');
}
