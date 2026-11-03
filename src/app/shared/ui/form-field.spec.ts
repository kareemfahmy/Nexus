import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormControlDirective, FormField } from './form-field';

@Component({
  imports: [ReactiveFormsModule, FormField, FormControlDirective],
  template: `
    <form [formGroup]="form">
      <nx-form-field label="Email" hint="Work email" [messages]="{ email: 'Use a valid email.' }">
        <input nxControl formControlName="email" />
      </nx-form-field>
    </form>
  `,
})
class Host {
  form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
  });
}

describe('FormField', () => {
  async function render() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return { fixture, el, input: el.querySelector('input')!, label: el.querySelector('label')! };
  }

  it('links the label to the control and describes it with the hint', async () => {
    const { input, label, el } = await render();
    expect(label.getAttribute('for')).toBe(input.id);
    const hint = el.querySelector('.hint')!;
    expect(input.getAttribute('aria-describedby')).toBe(hint.id);
  });

  it('does not show errors before the user leaves the field', async () => {
    const { el, input } = await render();
    expect(el.querySelector('.error')).toBeNull();
    expect(input.getAttribute('aria-invalid')).toBeNull();
  });

  it('shows the custom message, linked via aria-describedby, after blur', async () => {
    const { fixture, el, input } = await render();
    input.value = 'not-an-email';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    const error = el.querySelector('.error')!;
    expect(error.textContent?.trim()).toBe('Use a valid email.');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe(error.id);
  });
});
