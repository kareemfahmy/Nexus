import { Component, inject, Service, signal } from '@angular/core';
import { Icon, IconName } from './icon';

export type ToastTone = 'success' | 'danger' | 'info';

export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

const TOAST_ICON: Record<ToastTone, IconName> = { success: 'check', danger: 'alert', info: 'info' };
const AUTO_DISMISS_MS = 4000;

/** App-wide toast queue. Any component: `inject(ToastService).success('Saved')`. */
@Service()
export class ToastService {
  private nextId = 1;
  private readonly items = signal<readonly Toast[]>([]);
  readonly toasts = this.items.asReadonly();

  success(message: string): void {
    this.show('success', message);
  }
  error(message: string): void {
    this.show('danger', message);
  }
  info(message: string): void {
    this.show('info', message);
  }

  dismiss(id: number): void {
    this.items.update((list) => list.filter((t) => t.id !== id));
  }

  private show(tone: ToastTone, message: string): void {
    const id = this.nextId++;
    this.items.update((list) => [...list, { id, tone, message }]);
    setTimeout(() => this.dismiss(id), AUTO_DISMISS_MS);
  }
}

/**
 * Renders the queue. Lives once in the app shell.
 * `aria-live="polite"` announces toasts to screen readers WITHOUT moving focus.
 */
@Component({
  selector: 'nx-toast-container',
  imports: [Icon],
  template: `
    <div class="stack" aria-live="polite" aria-atomic="false">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="'tone-' + toast.tone" role="status">
          <nx-icon [name]="icons[toast.tone]" />
          <span class="message">{{ toast.message }}</span>
          <button
            type="button"
            class="close"
            aria-label="Dismiss notification"
            (click)="toastService.dismiss(toast.id)"
          >
            <nx-icon name="close" [size]="14" />
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .stack {
      position: fixed;
      right: var(--space-4);
      bottom: var(--space-4);
      z-index: var(--z-toast);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      max-width: min(400px, calc(100vw - 2 * var(--space-4)));
    }
    .toast {
      display: flex;
      align-items: flex-start;
      gap: var(--space-2);
      padding: var(--space-3);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-left-width: 3px;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
      animation: enter var(--duration-slow) var(--ease-out);
    }
    .tone-success {
      border-left-color: var(--status-success-dot);
      color: var(--status-success-fg);
    }
    .tone-danger {
      border-left-color: var(--status-danger-dot);
      color: var(--status-danger-fg);
    }
    .tone-info {
      border-left-color: var(--status-info-dot);
      color: var(--status-info-fg);
    }
    .message {
      flex: 1;
      color: var(--color-text);
    }
    .close {
      display: grid;
      place-items: center;
      width: var(--box-xs);
      height: var(--box-xs);
      padding: 0;
      border: 0;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--color-text-muted);
    }
    .close:hover {
      background: var(--color-surface-subtle);
    }
    @keyframes enter {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
    }
  `,
})
export class ToastContainer {
  protected readonly toastService = inject(ToastService);
  protected readonly icons = TOAST_ICON;
}
