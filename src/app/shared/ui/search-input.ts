import { Component, DestroyRef, inject, input, linkedSignal, output } from '@angular/core';
import { Icon } from './icon';

/**
 * Debounced search box.
 *
 * `draft` is a linkedSignal: it holds what the user is typing, but RESETS whenever the
 * `value` input changes (e.g. browser back restores an older ?q=). A plain signal would keep
 * showing stale text; a computed couldn't be typed into. That's exactly linkedSignal's job.
 */
@Component({
  selector: 'nx-search-input',
  imports: [Icon],
  template: `
    <label class="field">
      <span class="nx-visually-hidden">{{ label() }}</span>
      <nx-icon name="search" class="icon" />
      <input
        type="search"
        [value]="draft()"
        [placeholder]="placeholder()"
        (input)="onInput($any($event.target).value)"
        (keydown.enter)="flush()"
      />
    </label>
  `,
  styles: `
    .field {
      position: relative;
      display: flex;
      align-items: center;
      min-width: min(320px, 100%);
    }
    .icon {
      position: absolute;
      left: var(--space-3);
      color: var(--color-text-muted);
      pointer-events: none;
    }
    input {
      width: 100%;
      height: var(--control-height);
      padding: 0 var(--space-3) 0 calc(var(--space-3) + var(--space-5));
      border: 1px solid var(--control-border);
      border-radius: var(--control-radius);
      background: var(--color-surface);
    }
    input:focus-visible {
      outline: 2px solid var(--color-focus);
      outline-offset: 0;
      border-color: var(--color-focus);
    }
  `,
})
export class SearchInput {
  readonly value = input('');
  readonly label = input('Search');
  readonly placeholder = input('Search…');
  readonly debounceMs = input(300);
  readonly search = output<string>();

  protected readonly draft = linkedSignal(() => this.value());
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  protected onInput(text: string): void {
    this.draft.set(text);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), this.debounceMs());
  }

  protected flush(): void {
    clearTimeout(this.timer);
    const text = this.draft().trim();
    if (text !== this.value()) this.search.emit(text);
  }
}
