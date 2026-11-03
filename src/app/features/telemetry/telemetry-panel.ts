import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, input, resource, signal } from '@angular/core';
import type { EChartsCoreOption } from 'echarts/core';
import type { DeviceType, TelemetryMetric } from '../../shared/models/db';
import { METRIC } from '../../shared/models/labels';
import { Badge } from '../../shared/ui/badge';
import { Chart } from '../../shared/ui/chart';
import { Icon } from '../../shared/ui/icon';
import { Skeleton } from '../../shared/ui/skeleton';
import { RANGES, SeriesPoint, TelemetryRange, TelemetryService } from './telemetry.service';

/** Which metrics are charted together for each device type (same unit per chart). */
const CHART_METRICS: Partial<Record<DeviceType, TelemetryMetric[]>> = {
  thermostat: ['room_temp_f', 'cooling_setpoint_f', 'heating_setpoint_f'],
  temp_sensor: ['temperature_f'],
  humidity_sensor: ['humidity_pct'],
  energy_meter: ['power_kw'],
};

/** Reads a design token at runtime: canvas charts can't use CSS variables directly. */
function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Telemetry history with a range switcher. Chart + text summary + optional data table,
 * because a canvas chart alone is invisible to screen readers.
 */
@Component({
  selector: 'nx-telemetry-panel',
  imports: [DatePipe, DecimalPipe, Badge, Chart, Icon, Skeleton],
  template: `
    <section class="nx-panel" aria-labelledby="telemetry-heading">
      <div class="head">
        <h2 id="telemetry-heading">Telemetry</h2>
        <div class="controls">
          <nx-badge tone="accent"><nx-icon name="flask" [size]="12" /> Simulated</nx-badge>
          <div class="ranges" role="group" aria-label="Time range">
            @for (r of rangeKeys; track r) {
              <button type="button" [attr.aria-pressed]="range() === r" (click)="range.set(r)">
                {{ r }}
              </button>
            }
          </div>
        </div>
      </div>

      @if (!metrics().length) {
        <p class="nx-muted">This device type does not report telemetry.</p>
      } @else if (series.isLoading() && !series.hasValue()) {
        <nx-skeleton height="260px" />
      } @else if (series.error()) {
        <p class="nx-muted">Telemetry could not be loaded.</p>
      } @else if (!points().length) {
        <p class="nx-muted">No readings in the last {{ rangeLabel() }}.</p>
      } @else {
        <p class="summary">{{ summary() }}</p>
        <nx-chart [option]="option()" [label]="summary()" />
        <button
          type="button"
          class="table-toggle"
          [attr.aria-expanded]="showTable()"
          (click)="showTable.set(!showTable())"
        >
          {{ showTable() ? 'Hide' : 'Show' }} data table
        </button>
        @if (showTable()) {
          <div class="table-wrap">
            <table>
              <caption class="nx-visually-hidden">
                Telemetry readings,
                {{
                  rangeLabel()
                }}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Time</th>
                  @for (m of metrics(); track m) {
                    <th scope="col" class="end">{{ metricLabel(m) }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (row of tableRows(); track row.bucket) {
                  <tr>
                    <td>{{ row.bucket | date: 'MMM d, HH:mm' }}</td>
                    @for (m of metrics(); track m) {
                      <td class="end nx-tabular">{{ row.values[m] | number: '1.1-1' }}</td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    </section>
  `,
  styles: `
    .head {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2);
      margin-bottom: var(--space-3);
    }
    .head h2 {
      font-size: var(--text-md);
    }
    .controls,
    .ranges {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .ranges {
      gap: 0;
      border: 1px solid var(--color-border-strong);
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    .ranges button {
      height: var(--control-height-sm);
      padding: 0 var(--space-3);
      border: 0;
      background: var(--color-surface);
      color: var(--color-text-secondary);
      font-size: var(--text-sm);
    }
    .ranges button[aria-pressed='true'] {
      background: var(--color-accent-subtle);
      color: var(--color-accent-hover);
      font-weight: var(--weight-medium);
    }
    .summary {
      color: var(--color-text-secondary);
      font-size: var(--text-sm);
    }
    .table-toggle {
      margin-top: var(--space-2);
      padding: 0;
      border: 0;
      background: none;
      color: var(--color-accent);
      font-size: var(--text-sm);
    }
    .table-wrap {
      max-height: var(--scroll-panel-max);
      overflow: auto;
      margin-top: var(--space-2);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--text-sm);
    }
    th,
    td {
      padding: var(--space-1) var(--space-3);
      border-bottom: 1px solid var(--color-border);
      text-align: start;
    }
    th {
      position: sticky;
      top: 0;
      background: var(--table-header-bg);
    }
    .end {
      text-align: end;
    }
  `,
})
export class TelemetryPanel {
  readonly deviceId = input.required<string>();
  readonly deviceType = input.required<DeviceType>();

  private readonly telemetry = inject(TelemetryService);

  protected readonly rangeKeys = Object.keys(RANGES) as TelemetryRange[];
  protected readonly range = signal<TelemetryRange>('7d');
  protected readonly showTable = signal(false);
  protected readonly rangeLabel = computed(() => RANGES[this.range()].label);
  protected readonly metrics = computed(() => CHART_METRICS[this.deviceType()] ?? []);

  protected readonly series = resource({
    params: () =>
      this.metrics().length ? { id: this.deviceId(), range: this.range() } : undefined,
    loader: ({ params, abortSignal }) =>
      this.telemetry.series(params.id, params.range, abortSignal),
  });

  protected readonly points = computed<SeriesPoint[]>(() => {
    const wanted = new Set(this.metrics());
    return this.series.hasValue() ? this.series.value().filter((p) => wanted.has(p.metric)) : [];
  });

  protected metricLabel(m: TelemetryMetric): string {
    return `${METRIC[m].label} (${METRIC[m].unit})`;
  }

  /** One sentence describing the primary metric, used as text and as the chart's aria-label. */
  protected readonly summary = computed(() => {
    const primary = this.metrics()[0];
    const values = this.points()
      .filter((p) => p.metric === primary)
      .map((p) => p.value);
    if (!values.length) return '';
    const min = Math.min(...values).toFixed(1);
    const max = Math.max(...values).toFixed(1);
    const last = values[values.length - 1].toFixed(1);
    const { label, unit } = METRIC[primary];
    return `${label} ranged ${min}–${max} ${unit} over the last ${this.rangeLabel()}; latest ${last} ${unit}.`;
  });

  protected readonly tableRows = computed(() => {
    const byBucket = new Map<string, Partial<Record<TelemetryMetric, number>>>();
    for (const p of this.points()) {
      byBucket.set(p.bucket, { ...byBucket.get(p.bucket), [p.metric]: p.value });
    }
    return [...byBucket.entries()].reverse().map(([bucket, values]) => ({ bucket, values }));
  });

  protected readonly option = computed<EChartsCoreOption>(() => {
    const colors = [
      token('--color-accent'),
      token('--status-info-dot'),
      token('--status-warning-dot'),
    ];
    const grid = token('--color-border');
    const text = token('--color-text-secondary');
    const metrics = this.metrics();
    return {
      color: colors,
      animation: !matchMedia('(prefers-reduced-motion: reduce)').matches,
      grid: { left: 44, right: 16, top: 32, bottom: 28 },
      tooltip: { trigger: 'axis', valueFormatter: (v: number) => v?.toFixed(1) },
      legend: {
        top: 0,
        right: 0, // left side is taken by the y-axis unit label
        textStyle: { color: text },
        data: metrics.map((m) => METRIC[m].label),
      },
      xAxis: { type: 'time', axisLine: { lineStyle: { color: grid } }, axisLabel: { color: text } },
      yAxis: {
        type: 'value',
        scale: true,
        name: METRIC[metrics[0]]?.unit,
        nameTextStyle: { color: text },
        axisLabel: { color: text },
        splitLine: { lineStyle: { color: grid } },
      },
      series: metrics.map((m, i) => ({
        name: METRIC[m].label,
        type: 'line',
        showSymbol: false,
        // primary metric solid, setpoints dashed/dotted: series are distinguishable without colour
        lineStyle: {
          width: i === 0 ? 2 : 1.5,
          type: i === 0 ? 'solid' : i === 1 ? 'dashed' : 'dotted',
        },
        step: m.includes('setpoint') ? 'end' : false,
        data: this.points()
          .filter((p) => p.metric === m)
          .map((p) => [p.bucket, p.value]),
      })),
    };
  });
}
