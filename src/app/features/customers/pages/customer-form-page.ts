import { TitleCasePipe } from '@angular/common';
import { afterNextRender, Component, inject, Injector, input, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { describeError } from '../../../core/data/app-error';
import { BreadcrumbService } from '../../../core/layout/breadcrumb.service';
import type { CustomerInsert, CustomerStatus } from '../../../shared/models/db';
import { Button } from '../../../shared/ui/button';
import { FormControlDirective, FormField } from '../../../shared/ui/form-field';
import { Icon } from '../../../shared/ui/icon';
import { PageHeader } from '../../../shared/ui/page-header';
import { Skeleton } from '../../../shared/ui/skeleton';
import { ToastService } from '../../../shared/ui/toast';
import { CustomerService } from '../data/customer.service';

/**
 * Create AND edit in one component: `/customers/new` has no `id`, `/customers/:id/edit` does.
 *
 * Typed Reactive Forms: NonNullableFormBuilder makes every control FormControl<string> (never
 * `string | null`), so `getRawValue()` is fully typed. Optional DB columns are converted to
 * null only at the boundary (toInsert), keeping the form itself free of nulls.
 */
@Component({
  selector: 'nx-customer-form-page',
  imports: [
    TitleCasePipe,
    ReactiveFormsModule,
    RouterLink,
    Button,
    FormField,
    FormControlDirective,
    Icon,
    PageHeader,
    Skeleton,
  ],
  templateUrl: './customer-form-page.html',
})
export default class CustomerFormPage implements OnInit {
  readonly id = input<string>();

  private readonly service = inject(CustomerService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly crumbs = inject(BreadcrumbService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly injector = inject(Injector);

  protected readonly statuses: CustomerStatus[] = ['active', 'onboarding', 'inactive'];
  protected readonly terms = ['Net 15', 'Net 30', 'Net 45', 'Net 60'];

  protected readonly form = this.fb.group({
    account: this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      account_number: ['', [Validators.required, Validators.pattern(/^ACC-\d{4,8}$/)]],
      status: ['onboarding' as CustomerStatus, Validators.required],
      industry: [''],
    }),
    billing: this.fb.group({
      billing_email: ['', Validators.email],
      billing_address_line1: [''],
      billing_city: [''],
      billing_state: ['', Validators.pattern(/^[A-Z]{2}$/)],
      billing_postal_code: ['', Validators.pattern(/^\d{5}(-\d{4})?$/)],
      payment_terms: ['Net 30', Validators.required],
    }),
    notes: ['', Validators.maxLength(2000)],
  });

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');

  protected get isEdit(): boolean {
    return !!this.id();
  }

  async ngOnInit(): Promise<void> {
    const id = this.id();
    if (!id) return;
    this.loading.set(true);
    try {
      const c = await this.service.getById(id);
      this.crumbs.setLabel(`/customers/${id}`, c.name);
      // patchValue maps flat DB fields into the nested groups; `?? ''` keeps the form null-free
      this.form.patchValue({
        account: {
          name: c.name,
          account_number: c.account_number,
          status: c.status,
          industry: c.industry ?? '',
        },
        billing: {
          billing_email: c.billing_email ?? '',
          billing_address_line1: c.billing_address_line1 ?? '',
          billing_city: c.billing_city ?? '',
          billing_state: c.billing_state ?? '',
          billing_postal_code: c.billing_postal_code ?? '',
          payment_terms: c.payment_terms,
        },
        notes: c.notes ?? '',
      });
    } catch (err) {
      this.errorMessage.set(describeError(err));
    } finally {
      this.loading.set(false);
    }
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // reveals every inline error at once
      this.focusFirstInvalid();
      return;
    }
    this.saving.set(true);
    this.errorMessage.set('');
    try {
      const values = this.toInsert();
      const id = this.id();
      const saved = id ? await this.service.update(id, values) : await this.service.create(values);
      this.form.markAsPristine();
      this.toast.success(id ? 'Customer updated.' : `${saved.name} was created.`);
      await this.router.navigate(['/customers', saved.id]);
    } catch (err) {
      this.errorMessage.set(describeError(err));
    } finally {
      this.saving.set(false);
    }
  }

  private toInsert(): CustomerInsert {
    const { account, billing, notes } = this.form.getRawValue();
    const orNull = (v: string) => (v.trim() === '' ? null : v.trim());
    return {
      name: account.name.trim(),
      account_number: account.account_number.trim(),
      status: account.status,
      industry: orNull(account.industry),
      billing_email: orNull(billing.billing_email),
      billing_address_line1: orNull(billing.billing_address_line1),
      billing_city: orNull(billing.billing_city),
      billing_state: orNull(billing.billing_state),
      billing_postal_code: orNull(billing.billing_postal_code),
      payment_terms: billing.payment_terms,
      notes: orNull(notes),
    };
  }

  private focusFirstInvalid(): void {
    // Wait until Angular has rendered aria-invalid on the controls, then focus the first one.
    afterNextRender(
      () => document.querySelector<HTMLElement>('form [aria-invalid="true"]')?.focus(),
      { injector: this.injector },
    );
  }
}
