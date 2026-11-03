import { Component, inject, Service } from '@angular/core';
import { Dialog, DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';
import { Button } from './button';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` styles the confirm button red, for destructive actions. */
  tone?: 'primary' | 'danger';
}

/**
 * Accessible confirmation dialog built on the CDK Dialog:
 * focus is trapped inside, Esc and backdrop click cancel, focus returns to the trigger on close.
 */
@Component({
  selector: 'nx-confirm-dialog',
  imports: [Button],
  host: {
    role: 'alertdialog',
    '[attr.aria-labelledby]': '"confirm-title"',
    '[attr.aria-describedby]': '"confirm-message"',
  },
  template: `
    <h2 id="confirm-title">{{ data.title }}</h2>
    <p id="confirm-message">{{ data.message }}</p>
    <div class="actions">
      <button nxButton type="button" (click)="ref.close(false)">
        {{ data.cancelLabel ?? 'Cancel' }}
      </button>
      <button
        nxButton
        type="button"
        [variant]="data.tone ?? 'primary'"
        (click)="ref.close(true)"
        cdkFocusInitial
      >
        {{ data.confirmLabel ?? 'Confirm' }}
      </button>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: min(var(--dialog-width), calc(100vw - 2 * var(--space-4)));
      padding: var(--space-6);
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
    }
    h2 {
      font-size: var(--text-md);
      margin-bottom: var(--space-2);
    }
    p {
      color: var(--color-text-secondary);
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-2);
      margin-top: var(--space-6);
    }
  `,
})
export class ConfirmDialog {
  protected readonly data = inject<ConfirmOptions>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
}

/** `if (await inject(ConfirmService).ask({ title: 'Delete site?', ... , tone: 'danger' })) { ... }` */
@Service()
export class ConfirmService {
  private readonly dialog = inject(Dialog);

  async ask(options: ConfirmOptions): Promise<boolean> {
    const ref = this.dialog.open<boolean, ConfirmOptions>(ConfirmDialog, {
      data: options,
      backdropClass: 'nx-dialog-backdrop',
      ariaModal: true,
    });
    const result = await firstValueFrom(ref.closed);
    return result === true;
  }
}
