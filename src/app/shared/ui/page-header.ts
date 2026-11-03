import { Component, input } from '@angular/core';

/**
 * Standard page title row. Actions are projected into the `[actions]` slot:
 * <nx-page-header title="Sites" [count]="42"><button nxButton actions variant="primary">New site</button></nx-page-header>
 */
@Component({
  selector: 'nx-page-header',
  template: `
    <div class="titles">
      <h1>
        {{ title() }}
        @if (count() !== null) {
          <span class="count nx-tabular">{{ count() }}</span>
        }
      </h1>
      @if (subtitle()) {
        <p class="subtitle">{{ subtitle() }}</p>
      }
    </div>
    <div class="actions"><ng-content select="[actions]" /></div>
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: var(--space-3);
      margin-bottom: var(--space-5);
    }
    h1 {
      display: flex;
      align-items: baseline;
      gap: var(--space-2);
    }
    .count {
      font-size: var(--text-base);
      font-weight: var(--weight-regular);
      color: var(--color-text-muted);
    }
    .subtitle {
      margin-top: var(--space-1);
      color: var(--color-text-secondary);
    }
    .actions {
      display: flex;
      gap: var(--space-2);
    }
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly count = input<number | null>(null);
}
