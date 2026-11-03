import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, resource, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { describeError, isNotFound } from '../../../core/data/app-error';
import { BreadcrumbService } from '../../../core/layout/breadcrumb.service';
import type { Json } from '../../../shared/models/db';
import { CATEGORY_LABEL, DEVICE_TYPE_LABEL } from '../../../shared/models/labels';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { Button } from '../../../shared/ui/button';
import { EmptyState } from '../../../shared/ui/empty-state';
import { FormControlDirective, FormField } from '../../../shared/ui/form-field';
import { Icon } from '../../../shared/ui/icon';
import { PageHeader } from '../../../shared/ui/page-header';
import { Skeleton } from '../../../shared/ui/skeleton';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { ToastService } from '../../../shared/ui/toast';
import { TelemetryPanel } from '../../telemetry/telemetry-panel';
import { ThermostatCard } from '../../telemetry/thermostat-card';
import { ActivityItem, EquipmentService } from '../data/equipment.service';

type ActivityFilter = 'all' | 'note' | 'change';

/** Field names in audit diffs -> readable labels. Unlisted fields fall back to the raw name. */
const FIELD_LABEL: Record<string, string> = {
  status: 'Status',
  name: 'Name',
  area_served: 'Area served',
  manufacturer: 'Manufacturer',
  model: 'Model',
  serial_number: 'Serial number',
  install_date: 'Install date',
  warranty_until: 'Warranty',
  specs: 'Specifications',
  category: 'Category',
};

@Component({
  selector: 'nx-equipment-detail-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    RelativeTimePipe,
    Button,
    EmptyState,
    FormField,
    FormControlDirective,
    Icon,
    PageHeader,
    Skeleton,
    StatusBadge,
    TelemetryPanel,
    ThermostatCard,
  ],
  templateUrl: './equipment-detail-page.html',
  styleUrl: './equipment-detail-page.scss',
})
export default class EquipmentDetailPage {
  readonly id = input.required<string>();

  private readonly service = inject(EquipmentService);
  private readonly crumbs = inject(BreadcrumbService);
  private readonly toast = inject(ToastService);
  protected readonly auth = inject(AuthService);

  protected readonly equipment = resource({
    params: () => this.id(),
    loader: ({ params, abortSignal }) => this.service.getById(params, abortSignal),
  });
  protected readonly devices = resource({
    params: () => this.id(),
    loader: ({ params, abortSignal }) => this.service.devicesFor(params, abortSignal),
  });
  protected readonly activity = resource({
    params: () => this.id(),
    loader: ({ params, abortSignal }) => this.service.activity(params, abortSignal),
  });

  protected readonly categoryLabel = CATEGORY_LABEL;
  protected readonly typeLabel = DEVICE_TYPE_LABEL;
  protected readonly notFound = computed(() => isNotFound(this.equipment.error()));
  protected readonly errorMessage = computed(() =>
    this.equipment.error() ? describeError(this.equipment.error()) : '',
  );

  /** The thermostat linked to this unit, if any: drives the monitoring section. */
  protected readonly thermostat = computed(() =>
    this.devices.hasValue()
      ? this.devices.value().find((d) => d.device_type === 'thermostat')
      : undefined,
  );
  /** For refrigeration, chart the temperature sensor instead. */
  protected readonly sensor = computed(() =>
    this.devices.hasValue()
      ? this.devices.value().find((d) => d.device_type === 'temp_sensor')
      : undefined,
  );

  protected readonly specs = computed(() => {
    if (!this.equipment.hasValue()) return [];
    const raw = this.equipment.value().specs;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return [];
    return Object.entries(raw).map(([key, value]) => ({
      label: key.replaceAll('_', ' ').replace(/^\w/, (c) => c.toUpperCase()),
      value: typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value),
    }));
  });

  // Unified timeline -----------------------------------------------------------------
  protected readonly filter = signal<ActivityFilter>('all');
  protected readonly filters: { value: ActivityFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'note', label: 'Notes' },
    { value: 'change', label: 'Changes' },
  ];
  protected readonly timeline = computed<ActivityItem[]>(() => {
    const items = this.activity.hasValue() ? this.activity.value() : [];
    const f = this.filter();
    return f === 'all' ? items : items.filter((i) => i.kind === f);
  });

  protected describeChange(item: Extract<ActivityItem, { kind: 'change' }>): string[] {
    if (item.action === 'created') return ['Equipment record created'];
    return Object.entries(item.changes).map(
      ([field, { old, new: next }]) => `${FIELD_LABEL[field] ?? field}: ${fmt(old)} → ${fmt(next)}`,
    );
  }

  // Add note ---------------------------------------------------------------------------
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly noteForm = this.fb.group({
    body: ['', [Validators.required, Validators.maxLength(2000)]],
  });
  protected readonly savingNote = signal(false);

  protected async addNote(): Promise<void> {
    if (this.noteForm.invalid) {
      this.noteForm.markAllAsTouched();
      return;
    }
    this.savingNote.set(true);
    try {
      await this.service.addNote(this.id(), this.noteForm.getRawValue().body.trim());
      this.noteForm.reset();
      this.toast.success('Note added.');
      this.activity.reload();
    } catch (err) {
      this.toast.error(describeError(err));
    } finally {
      this.savingNote.set(false);
    }
  }

  constructor() {
    effect(() => {
      if (this.equipment.hasValue()) {
        this.crumbs.setLabel(`/equipment/${this.id()}`, this.equipment.value().name);
      }
    });
  }
}

function fmt(v: Json): string {
  if (v === null || v === undefined || v === '') return '–';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v).replaceAll('_', ' ');
}
