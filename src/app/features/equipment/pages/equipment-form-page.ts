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
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { describeError } from '../../../core/data/app-error';
import { BreadcrumbService } from '../../../core/layout/breadcrumb.service';
import type {
  EquipmentCategory,
  EquipmentInsert,
  EquipmentStatus,
} from '../../../shared/models/db';
import { CATEGORY_LABEL, CATEGORY_ORDER } from '../../../shared/models/labels';
import { Button } from '../../../shared/ui/button';
import { FormControlDirective, FormField } from '../../../shared/ui/form-field';
import { Icon } from '../../../shared/ui/icon';
import { PageHeader } from '../../../shared/ui/page-header';
import { Skeleton } from '../../../shared/ui/skeleton';
import { ToastService } from '../../../shared/ui/toast';
import { EquipmentService } from '../data/equipment.service';

/**
 * Cross-field validator on the group: warranty can't end before installation.
 * The same rule is a CHECK constraint in Postgres; this one just gives earlier, friendlier feedback.
 */
function warrantyAfterInstall(group: AbstractControl): ValidationErrors | null {
  const install = group.get('install_date')?.value as string;
  const warranty = group.get('warranty_until')?.value as string;
  return install && warranty && warranty < install ? { warrantyBeforeInstall: true } : null;
}

/** Create (/equipment/new?site=<id>) and edit (/equipment/:id/edit). Edits are audited by trigger. */
@Component({
  selector: 'nx-equipment-form-page',
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
  templateUrl: './equipment-form-page.html',
})
export default class EquipmentFormPage implements OnInit {
  readonly id = input<string>();
  readonly site = input<string>();

  private readonly service = inject(EquipmentService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly crumbs = inject(BreadcrumbService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly injector = inject(Injector);

  protected readonly categories = CATEGORY_ORDER.map((c) => ({
    value: c,
    label: CATEGORY_LABEL[c],
  }));
  protected readonly statuses: EquipmentStatus[] = [
    'operational',
    'degraded',
    'down',
    'decommissioned',
  ];
  protected readonly siteOptions = resource({
    loader: ({ abortSignal }) => this.service.siteOptions(abortSignal),
  });

  protected readonly form = this.fb.group({
    site_id: ['', Validators.required],
    category: ['hvac' as EquipmentCategory, Validators.required],
    name: ['', [Validators.required, Validators.maxLength(120)]],
    area_served: [''],
    status: ['operational' as EquipmentStatus, Validators.required],
    manufacturer: [''],
    model: [''],
    serial_number: [''],
    dates: this.fb.group(
      { install_date: [''], warranty_until: [''] },
      { validators: warrantyAfterInstall },
    ),
  });

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal('');

  protected get isEdit(): boolean {
    return !!this.id();
  }

  protected get datesError(): boolean {
    const g = this.form.controls.dates;
    return g.hasError('warrantyBeforeInstall') && (g.touched || g.dirty);
  }

  async ngOnInit(): Promise<void> {
    const id = this.id();
    if (!id) {
      if (this.site()) this.form.controls.site_id.setValue(this.site()!);
      return;
    }
    this.loading.set(true);
    try {
      const e = await this.service.getById(id);
      this.crumbs.setLabel(`/equipment/${id}`, e.name);
      this.form.patchValue({
        site_id: e.site_id,
        category: e.category,
        name: e.name,
        area_served: e.area_served ?? '',
        status: e.status,
        manufacturer: e.manufacturer ?? '',
        model: e.model ?? '',
        serial_number: e.serial_number ?? '',
        dates: { install_date: e.install_date ?? '', warranty_until: e.warranty_until ?? '' },
      });
      this.form.controls.site_id.disable();
    } catch (err) {
      this.errorMessage.set(describeError(err));
    } finally {
      this.loading.set(false);
    }
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      afterNextRender(
        () => document.querySelector<HTMLElement>('form [aria-invalid="true"]')?.focus(),
        {
          injector: this.injector,
        },
      );
      return;
    }
    this.saving.set(true);
    this.errorMessage.set('');
    try {
      const values = this.toInsert();
      const id = this.id();
      const saved = id ? await this.service.update(id, values) : await this.service.create(values);
      this.toast.success(
        id ? 'Equipment updated. The change is in its activity log.' : `${saved.name} was added.`,
      );
      await this.router.navigate(['/equipment', saved.id]);
    } catch (err) {
      this.errorMessage.set(describeError(err));
    } finally {
      this.saving.set(false);
    }
  }

  private toInsert(): EquipmentInsert {
    const v = this.form.getRawValue();
    const orNull = (s: string) => (s.trim() ? s.trim() : null);
    return {
      site_id: v.site_id,
      category: v.category,
      name: v.name.trim(),
      area_served: orNull(v.area_served),
      status: v.status,
      manufacturer: orNull(v.manufacturer),
      model: orNull(v.model),
      serial_number: orNull(v.serial_number),
      install_date: v.dates.install_date || null,
      warranty_until: v.dates.warranty_until || null,
    };
  }
}
