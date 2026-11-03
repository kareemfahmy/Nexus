import {
  booleanAttribute,
  Component,
  computed,
  contentChild,
  Directive,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { NgControl, ValidationErrors } from '@angular/forms';

let nextId = 0;

function defaultMessage(key: string, detail: unknown): string {
  const d = (detail ?? {}) as Record<string, unknown>;
  switch (key) {
    case 'required':
      return 'This field is required.';
    case 'email':
      return 'Enter a valid email address, for example name@company.com.';
    case 'minlength':
      return `Use at least ${d['requiredLength']} characters.`;
    case 'maxlength':
      return `Use at most ${d['requiredLength']} characters.`;
    case 'min':
      return `Enter ${d['min']} or more.`;
    case 'max':
      return `Enter ${d['max']} or less.`;
    case 'pattern':
      return 'Check the format of this value.';
    default:
      return 'Check this value.';
  }
}

/**
 * Label + control + hint + error, wired for accessibility.
 *
 *   <nx-form-field label="Email" [messages]="{ email: 'Use a work email' }">
 *     <input nxControl formControlName="email" type="email" />
 *   </nx-form-field>
 *
 * How it works (hierarchical DI): the nxControl directive injects the NEAREST FormField
 * ancestor and binds id / aria-describedby / aria-invalid from it. The field finds the
 * Reactive Forms control with a content query on NgControl and re-evaluates the error when
 * the control emits events (value, status, touched). Errors show only after the user leaves
 * the field (touched), matching "validate on blur".
 */
@Component({
  selector: 'nx-form-field',
  template: `
    <label [attr.for]="controlId" class="label">
      {{ label() }}
      @if (required()) {
        <span class="req" aria-hidden="true">*</span>
      }
    </label>
    <ng-content />
    @if (errorText()) {
      <p class="error" [id]="errorId" role="alert">{{ errorText() }}</p>
    } @else if (hint()) {
      <p class="hint" [id]="hintId">{{ hint() }}</p>
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: var(--space-1);
      align-content: start;
    }
    .label {
      font-weight: var(--weight-medium);
    }
    .req {
      color: var(--status-danger-fg);
      margin-left: 2px;
    }
    .hint {
      font-size: var(--text-sm);
      color: var(--color-text-muted);
    }
    .error {
      font-size: var(--text-sm);
      color: var(--status-danger-fg);
    }
  `,
})
export class FormField {
  readonly label = input.required<string>();
  readonly hint = input('');
  readonly required = input(false, { transform: booleanAttribute });
  readonly messages = input<Record<string, string>>({});

  readonly controlId = `nx-field-${nextId++}`;
  readonly hintId = `${this.controlId}-hint`;
  readonly errorId = `${this.controlId}-error`;

  private readonly ngControl = contentChild(NgControl, { descendants: true });
  private readonly version = signal(0);

  constructor() {
    // Bridge the control's RxJS event stream into a signal tick so computeds below re-run.
    effect((onCleanup) => {
      const control = this.ngControl()?.control;
      if (!control) return;
      const sub = control.events.subscribe(() => this.version.update((v) => v + 1));
      onCleanup(() => sub.unsubscribe());
    });
  }

  readonly errorText = computed(() => {
    this.version();
    const control = this.ngControl()?.control;
    if (!control || !control.invalid || !control.touched) return '';
    const errors: ValidationErrors = control.errors ?? {};
    const key = Object.keys(errors)[0];
    return key ? (this.messages()[key] ?? defaultMessage(key, errors[key])) : '';
  });

  readonly invalid = computed(() => this.errorText() !== '');
  readonly describedBy = computed(() =>
    this.errorText() ? this.errorId : this.hint() ? this.hintId : null,
  );
}

/** Marks the control inside an nx-form-field; gets its id and ARIA links from the field. */
@Directive({
  selector: 'input[nxControl], select[nxControl], textarea[nxControl]',
  host: {
    class: 'nx-control',
    '[id]': 'field.controlId',
    '[attr.aria-describedby]': 'field.describedBy()',
    '[attr.aria-invalid]': 'field.invalid() || null',
  },
})
export class FormControlDirective {
  protected readonly field = inject(FormField);
}
