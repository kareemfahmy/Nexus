import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, resource } from '@angular/core';
import type { TelemetryMetric } from '../../shared/models/db';
import { isStale, RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { Badge } from '../../shared/ui/badge';
import { Icon } from '../../shared/ui/icon';
import { Skeleton } from '../../shared/ui/skeleton';
import { TelemetryService } from './telemetry.service';

const STALE_AFTER_MIN = 30;

/**
 * Current thermostat state, replacing FSG's skeuomorphic thermometer with what an operator
 * actually needs: room temperature vs. setpoints, mode, occupancy, freshness.
 * Mode and occupancy are DERIVED from the latest readings (the simulator has no mode field).
 */
@Component({
  selector: 'nx-thermostat-card',
  imports: [DatePipe, RelativeTimePipe, Badge, Icon, Skeleton],
  template: `
    <section class="nx-panel" aria-labelledby="tstat-heading">
      <div class="head">
        <h2 id="tstat-heading">Thermostat</h2>
        <nx-badge tone="accent"><nx-icon name="flask" [size]="12" /> Simulated</nx-badge>
      </div>
      @if (state(); as s) {
        <div class="grid">
          <div class="primary">
            <p class="label">Room temperature</p>
            <p class="temp nx-tabular">{{ s.room ?? '–' }}<span class="unit">°F</span></p>
            <p class="mode">
              <nx-badge [tone]="s.mode === 'Idle' ? 'neutral' : 'info'" dot>{{ s.mode }}</nx-badge>
              <nx-badge tone="neutral">{{
                s.occupied ? 'Occupied schedule' : 'Unoccupied schedule'
              }}</nx-badge>
            </p>
          </div>
          <dl class="nx-dl">
            <dt>Cooling setpoint</dt>
            <dd class="nx-tabular">{{ s.cool ?? '–' }} °F</dd>
            <dt>Heating setpoint</dt>
            <dd class="nx-tabular">{{ s.heat ?? '–' }} °F</dd>
            <dt>Humidity</dt>
            <dd class="nx-tabular">{{ s.humidity ?? '–' }} %</dd>
            <dt>Last reading</dt>
            <dd>
              <time [attr.datetime]="s.at" [title]="s.at | date: 'medium'">{{
                s.at | relativeTime
              }}</time>
              @if (s.stale) {
                <nx-badge tone="warning">Stale</nx-badge>
              }
            </dd>
          </dl>
        </div>
      } @else if (latest.isLoading()) {
        <nx-skeleton height="120px" />
      } @else {
        <p class="nx-muted">No readings received from this thermostat.</p>
      }
    </section>
  `,
  styles: `
    .head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-3);
    }
    .head h2 {
      font-size: var(--text-md);
    }
    .grid {
      display: grid;
      grid-template-columns: minmax(160px, 1fr) 2fr;
      gap: var(--space-5);
      align-items: start;
    }
    .label {
      color: var(--color-text-secondary);
      font-size: var(--text-sm);
    }
    .temp {
      font-size: var(--text-display);
      font-weight: var(--weight-semibold);
      line-height: var(--leading-tight);
    }
    .unit {
      font-size: var(--text-md);
      color: var(--color-text-secondary);
      margin-left: 2px;
    }
    .mode {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1);
      margin-top: var(--space-2);
    }
  `,
})
export class ThermostatCard {
  readonly deviceId = input.required<string>();
  private readonly telemetry = inject(TelemetryService);

  protected readonly latest = resource({
    params: () => this.deviceId(),
    loader: ({ params, abortSignal }) => this.telemetry.latest(params, abortSignal),
  });

  protected readonly state = computed(() => {
    if (!this.latest.hasValue() || this.latest.value().length === 0) return null;
    const rows = this.latest.value();
    const get = (m: TelemetryMetric) => rows.find((r) => r.metric === m)?.value ?? null;
    const room = get('room_temp_f');
    const cool = get('cooling_setpoint_f');
    const heat = get('heating_setpoint_f');
    const at = rows.reduce(
      (max, r) => ((r.recorded_at ?? '') > max ? (r.recorded_at ?? '') : max),
      '',
    );
    const mode =
      room !== null && cool !== null && room > cool + 0.5
        ? 'Cooling'
        : room !== null && heat !== null && room < heat - 0.5
          ? 'Heating'
          : 'Idle';
    return {
      room: room?.toFixed(1) ?? null,
      cool,
      heat,
      humidity: get('humidity_pct')?.toFixed(0) ?? null,
      mode,
      occupied: cool === 72, // the simulated schedule uses 72/68 occupied, 78/62 unoccupied
      at,
      stale: isStale(at, STALE_AFTER_MIN),
    };
  });
}
