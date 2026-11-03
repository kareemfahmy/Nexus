import { Component, computed, input, output } from '@angular/core';
import { Icon } from './icon';

/** "26–50 of 134" with previous/next. Pages are 1-based. */
@Component({
  selector: 'nx-pagination',
  imports: [Icon],
  template: `
    <nav aria-label="Pagination">
      <p class="range nx-tabular" aria-live="polite">
        @if (total() > 0) {
          {{ first() }}–{{ last() }} of {{ total() }}
        } @else {
          0 results
        }
      </p>
      <div class="buttons">
        <button
          type="button"
          [disabled]="page() <= 1"
          aria-label="Previous page"
          (click)="pageChange.emit(page() - 1)"
        >
          <nx-icon name="chevron-left" />
        </button>
        <span class="nx-tabular">Page {{ page() }} of {{ pageCount() }}</span>
        <button
          type="button"
          [disabled]="page() >= pageCount()"
          aria-label="Next page"
          (click)="pageChange.emit(page() + 1)"
        >
          <nx-icon name="chevron-right" />
        </button>
      </div>
    </nav>
  `,
  styles: `
    nav {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
      padding: var(--space-3) 0;
      color: var(--color-text-secondary);
      font-size: var(--text-sm);
    }
    .buttons {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    button {
      display: grid;
      place-items: center;
      width: var(--box-md);
      height: var(--box-md);
      padding: 0;
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      color: var(--color-text);
    }
    button:hover:not(:disabled) {
      background: var(--color-surface-subtle);
    }
    button:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  `,
})
export class Pagination {
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly total = input.required<number>();
  readonly pageChange = output<number>();

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize())),
  );
  protected readonly first = computed(() => (this.page() - 1) * this.pageSize() + 1);
  protected readonly last = computed(() => Math.min(this.total(), this.page() * this.pageSize()));
}
