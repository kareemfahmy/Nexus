import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Button } from '../../shared/ui/button';
import { Icon } from '../../shared/ui/icon';

/**
 * Sign-in page.
 *
 * Reactive Forms: the form model lives in TypeScript (`this.form`), the template only binds to it.
 * `fb.nonNullable` makes every control `FormControl<string>` (never `string | null`), so
 * `form.getRawValue()` is fully typed with no null checks.
 */
@Component({
  selector: 'nx-login-page',
  imports: [ReactiveFormsModule, Button, Icon],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export default class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder).nonNullable;

  /** `?returnUrl=` query param, bound by withComponentInputBinding(). */
  readonly returnUrl = input<string>();

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected readonly signingIn = signal(false);
  protected readonly guestLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // reveals inline errors on every field
      return;
    }
    this.errorMessage.set(null);
    this.signingIn.set(true);
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.signInWithPassword(email, password);
      await this.router.navigateByUrl(this.safeReturnUrl());
    } catch (err) {
      this.errorMessage.set(this.describe(err, 'Sign-in failed. Check your email and password.'));
    } finally {
      this.signingIn.set(false);
    }
  }

  protected async exploreDemo(): Promise<void> {
    this.errorMessage.set(null);
    this.guestLoading.set(true);
    try {
      await this.auth.signInAsGuest();
      await this.router.navigateByUrl(this.safeReturnUrl());
    } catch (err) {
      this.errorMessage.set(
        this.describe(err, 'Guest access is unavailable right now. Please try again shortly.'),
      );
    } finally {
      this.guestLoading.set(false);
    }
  }

  protected showError(control: 'email' | 'password'): boolean {
    const c = this.form.controls[control];
    return c.invalid && c.touched;
  }

  /** Only allow in-app redirects (prevents open-redirect via ?returnUrl=https://evil.example). */
  private safeReturnUrl(): string {
    const url = this.returnUrl();
    return url && url.startsWith('/') && !url.startsWith('//') ? url : '/dashboard';
  }

  private describe(err: unknown, fallback: string): string {
    const message = err instanceof Error ? err.message : '';
    if (/anonymous sign-ins are disabled/i.test(message)) {
      return 'Guest access is not enabled for this demo yet. Sign in with an account instead.';
    }
    if (/invalid login credentials/i.test(message)) {
      return 'That email and password combination is not recognised.';
    }
    return fallback;
  }
}
