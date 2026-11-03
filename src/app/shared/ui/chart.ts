import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import type { EChartsCoreOption, EChartsType } from 'echarts/core';

/**
 * Thin wrapper around Apache ECharts (canvas renderer, tree-shaken modules).
 *
 * Integrating a DOM-owning third-party library in Angular:
 *  1. Create it in afterNextRender: the <div> must exist and have a size (never in the constructor).
 *  2. Lazy-load the library with dynamic import() so charts don't bloat the initial bundle.
 *  3. Push new options in an effect: `option` is a signal input, so the effect re-runs on change.
 *     This is a legitimate effect: synchronising Angular state INTO a non-Angular object.
 *  4. Resize with a ResizeObserver and clean everything up through DestroyRef.
 *
 * Accessibility: a canvas is invisible to screen readers, so callers must provide `label`
 * (a one-sentence summary) and a data-table alternative next to the chart.
 */
@Component({
  selector: 'nx-chart',
  host: { role: 'img', '[attr.aria-label]': 'label()' },
  template: `<div #canvas class="canvas" [style.height]="height()"></div>`,
  styles: `
    :host {
      display: block;
    }
    .canvas {
      width: 100%;
    }
  `,
})
export class Chart {
  readonly option = input.required<EChartsCoreOption>();
  readonly label = input.required<string>();
  readonly height = input('260px');

  private readonly canvas = viewChild.required<ElementRef<HTMLDivElement>>('canvas');
  private chart: EChartsType | undefined;

  constructor() {
    const destroyRef = inject(DestroyRef);
    let observer: ResizeObserver | undefined;

    afterNextRender(async () => {
      const echarts = await loadEcharts();
      if (destroyRef.destroyed) return;
      this.chart = echarts.init(this.canvas().nativeElement, undefined, { renderer: 'canvas' });
      this.chart.setOption(this.option());
      observer = new ResizeObserver(() => this.chart?.resize());
      observer.observe(this.canvas().nativeElement);
    });

    effect(() => {
      const option = this.option();
      // notMerge: replace series entirely when the range changes, instead of merging stale ones
      this.chart?.setOption(option, { notMerge: true });
    });

    destroyRef.onDestroy(() => {
      observer?.disconnect();
      this.chart?.dispose();
    });
  }
}

let echartsPromise: Promise<typeof import('echarts/core')> | undefined;

/** Registers only the pieces Nexus uses (line charts, grid, tooltip, legend, canvas). */
function loadEcharts(): Promise<typeof import('echarts/core')> {
  echartsPromise ??= Promise.all([
    import('echarts/core'),
    import('echarts/charts'),
    import('echarts/components'),
    import('echarts/renderers'),
  ]).then(([core, charts, components, renderers]) => {
    core.use([
      charts.LineChart,
      charts.BarChart,
      components.GridComponent,
      components.TooltipComponent,
      components.LegendComponent,
      components.DataZoomComponent,
      renderers.CanvasRenderer,
    ]);
    return core;
  });
  return echartsPromise;
}
