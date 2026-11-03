import { TitleCasePipe } from '@angular/common';
import {
  afterNextRender,
  Component,
  inject,
  Injector,
  input,
  OnInit,
  resource,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { describeError } from '../../../core/data/app-error';
import { BreadcrumbService } from '../../../core/layout/breadcrumb.service';
import type { SiteInsert, SiteStatus } from '../../../shared/models/db';
import { Button } from '../../../shared/ui/button';
import { FormControlDirective, FormField } from '../../../shared/ui/form-field';
import { Icon } from '../../../shared/ui/icon';
import { PageHeader } from '../../../shared/ui/page-header';
import { Skeleton } from '../../../shared/ui/skeleton';
import { ToastService } from '../../../shared/ui/toast';
import { SiteService } from '../data/site.service';

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Phoenix',
  'America/Los_Angeles',
] as const;

/** Create (/sites/new, optional ?customer=<id> prefill) and edit (/sites/:id/edit). */
@Component({
  selector: 'nx-site-form-page',
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
  templateUrl: './site-form-page.html',
})
export default class SiteFormPage implements OnInit {
  readonly id = input<string>();
  /** ?customer= query param: pre-selects the owner when coming from a customer page. */
  readonly customer = input<string>();

  private readonly service = inject(SiteService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly crumbs = inject(BreadcrumbService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly injector = inject(Injector);

  protected readonly statuses: SiteStatus[] = ['onboarding', 'active', 'inactive'];
  protected readonly timezones = TIMEZONES;
  protected readonly customerOptions = resource({
    loader: ({ abortSignal }) => this.service.customerOptions(abortSignal),
  });

  protected readonly form = this.fb.group({
    identity: this.fb.group({
      customer_id: ['', Validators.required],
      code: ['', [Validators.required, Validators.pattern(/^[A-Z]{2,5}-\d{3,5}$/)]],
      name: ['', [Validators.required, Validators.maxLength(120)]],
      status: ['onboarding' as SiteStatus, Validators.required],
    }),
    location: this.fb.group({
      address_line1: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', [Validators.required, Validators.pattern(/^[A-Z]{2}$/)]],
      postal_code: ['', [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]],
      timezone: ['America/New_York' as string, Validators.required],
    }),
    facility: this.fb.group({
      // number inputs still yield strings from the DOM; keep the control a string and convert at save
      square_footage: ['', Validators.pattern(/^\d{3,7}$/)],
      opened_on: [''],
    }),
  });

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');

  protected get isEdit(): boolean {
    return !!this.id();
  }

  async ngOnInit(): Promise<void> {
    const id = this.id();
    if (!id) {
      const customer = this.customer();
      if (customer) this.form.controls.identity.controls.customer_id.setValue(customer);
      return;
    }
    this.loading.set(true);
    try {
      const s = await this.service.getById(id);
      this.crumbs.setLabel(`/sites/${id}`, s.code);
      this.form.patchValue({
        identity: { customer_id: s.customer_id, code: s.code, name: s.name, status: s.status },
        location: {
          address_line1: s.address_line1,
          city: s.city,
          state: s.state,
          postal_code: s.postal_code,
          timezone: s.timezone,
        },
        facility: {
          square_footage: s.square_footage?.toString() ?? '',
          opened_on: s.opened_on ?? '',
        },
      });
      // Moving a site to another customer is a deliberate admin operation, not a form edit.
      this.form.controls.identity.controls.customer_id.disable();
    } catch (err) {
      this.errorMessage.set(describeError(err));
    } finally {
      this.loading.set(false);
    }
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      // Wait until Angular has rendered aria-invalid on the controls, then focus the first one.
      afterNextRender(
        () => document.querySelector<HTMLElement>('form [aria-invalid="true"]')?.focus(),
        { injector: this.injector },
      );
      return;
    }
    this.saving.set(true);
    this.errorMessage.set('');
    try {
      const values = this.toInsert();
      const id = this.id();
      const saved = id ? await this.service.update(id, values) : await this.service.create(values);
      this.toast.success(id ? 'Site updated.' : `Site ${saved.code} was created.`);
      await this.router.navigate(['/sites', saved.id]);
    } catch (err) {
      this.errorMessage.set(describeError(err));
    } finally {
      this.saving.set(false);
    }
  }

  private toInsert(): SiteInsert {
    // getRawValue includes disabled controls (customer_id on edit); value would omit them.
    const { identity, location, facility } = this.form.getRawValue();
    return {
      ...identity,
      code: identity.code.trim(),
      name: identity.name.trim(),
      ...location,
      square_footage: facility.square_footage ? Number(facility.square_footage) : null,
      opened_on: facility.opened_on || null,
    };
  }
}
