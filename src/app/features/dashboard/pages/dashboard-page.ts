import { DatePipe } from '@angular/common';
import { Component, computed, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { EChartsCoreOption } from 'echarts/core';
import { AuthService } from '../../../core/auth/auth.service';
import { DEVICE_TYPE_LABEL } from '../../../shared/models/labels';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { Chart } from '../../../shared/ui/chart';
import { KpiStat } from '../../../shared/ui/kpi-stat';
import { PageHeader } from '../../../shared/ui/page-header';
import { Skeleton } from '../../../shared/ui/skeleton';
import { StatusBadge } from '../../../shared/ui/status-badge';
import { DashboardService, WeeklyTrend } from '../data/dashboard.service';

const WEEKS = 12;

function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * The operations dashboard answers "what needs my attention right now?":
 * compact KPIs, three action lists, and two throughput trends ("are we keeping up?").
 * Six independent resources load in parallel; each section owns its loading and empty state,
 * so one slow query never blanks the whole page.
 */
@Component({
  selector: 'nx-dashboard-page',
  imports: [
    DatePipe,
    RouterLink,
    RelativeTimePipe,
    Chart,
    KpiStat,
    PageHeader,
    Skeleton,
    StatusBadge,
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export default class DashboardPage {
  private readonly service = inject(DashboardService);
  protected readonly auth = inject(AuthService);
  protected readonly typeLabel = DEVICE_TYPE_LABEL;

  protected readonly kpis = resource({
    loader: ({ abortSignal }) => this.service.kpis(abortSignal),
  });
  protected readonly devices = resource({
    loader: ({ abortSignal }) => this.service.attentionDevices(abortSignal),
  });
  protected readonly overdue = resource({
    loader: ({ abortSignal }) => this.service.overdueWorkOrders(abortSignal),
  });
  protected readonly incidents = resource({
    loader: ({ abortSignal }) => this.service.criticalIncidents(abortSignal),
  });
  protected readonly trend = resource({
    loader: ({ abortSignal }) => this.service.weeklyTrend(WEEKS, abortSignal),
  });

  protected readonly k = computed(() => (this.kpis.hasValue() ? this.kpis.value() : null));

  protected readonly onlinePct = computed(() => {
    const k = this.k();
    if (!k?.devices) return null;
    return Math.round(((k.devices_online ?? 0) / k.devices) * 100);
  });

  private readonly weeks = computed<WeeklyTrend[]>(() =>
    this.trend.hasValue() ? this.trend.value() : [],
  );

  /** Text equivalents of the charts (screen readers can't read a canvas). */
  protected readonly woSummary = computed(() => {
    const w = this.weeks();
    const created = w.reduce((a, r) => a + r.wo_created, 0);
    const completed = w.reduce((a, r) => a + r.wo_completed, 0);
    return `Last ${WEEKS} weeks: ${created} work orders created, ${completed} completed${
      created > completed ? `; the backlog grew by ${created - completed}` : ''
    }.`;
  });
  protected readonly incSummary = computed(() => {
    const w = this.weeks();
    const opened = w.reduce((a, r) => a + r.incidents_opened, 0);
    const resolved = w.reduce((a, r) => a + r.incidents_resolved, 0);
    return `Last ${WEEKS} weeks: ${opened} incidents opened, ${resolved} resolved.`;
  });

  protected readonly woOption = computed(() =>
    this.barOption('wo_created', 'wo_completed', 'Created', 'Completed'),
  );
  protected readonly incOption = computed(() =>
    this.barOption('incidents_opened', 'incidents_resolved', 'Opened', 'Resolved'),
  );

  private barOption(
    inKey: keyof WeeklyTrend,
    outKey: keyof WeeklyTrend,
    inLabel: string,
    outLabel: string,
  ): EChartsCoreOption {
    const text = token('--color-text-secondary');
    const grid = token('--color-border');
    const rows = this.weeks();
    const label = (iso: string) =>
      new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return {
      color: [token('--color-accent'), token('--status-success-dot')],
      animation: !matchMedia('(prefers-reduced-motion: reduce)').matches,
      grid: { left: 32, right: 8, top: 32, bottom: 24 },
      tooltip: { trigger: 'axis' },
      legend: { top: 0, right: 0, textStyle: { color: text } },
      xAxis: {
        type: 'category',
        data: rows.map((r) => label(r.week)),
        axisLabel: { color: text },
        axisLine: { lineStyle: { color: grid } },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: text },
        splitLine: { lineStyle: { color: grid } },
      },
      series: [
        { name: inLabel, type: 'bar', barGap: '10%', data: rows.map((r) => r[inKey]) },
        // second series hatched-by-opacity so the pair reads without relying on hue alone
        {
          name: outLabel,
          type: 'bar',
          itemStyle: { opacity: 0.85 },
          data: rows.map((r) => r[outKey]),
        },
      ],
    };
  }

  protected readonly greeting = computed(() => {
    const h = new Date().getHours();
    const part = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    const name = this.auth.isGuest() ? '' : `, ${this.auth.displayName().split(' ')[0]}`;
    return part + name;
  });
}
