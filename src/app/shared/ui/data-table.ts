import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  computed,
  contentChildren,
  Directive,
  inject,
  input,
  output,
  TemplateRef,
} from '@angular/core';
import { Router } from '@angular/router';
import type { SortDir } from '../../core/data/list-query';
import { Icon } from './icon';
import { Skeleton } from './skeleton';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'start' | 'end';
  width?: string;
  /** Hide below 768px to keep mobile rows readable. */
  hideOnMobile?: boolean;
}

export interface SortChange {
  sort: string;
  dir: SortDir;
}

/**
 * Custom cell renderer, matched to a column by key:
 *   <ng-template nxCell="status" let-row><nx-status-badge [status]="row.status" /></ng-template>
 * The table finds these with a content query and renders them with ngTemplateOutlet.
 */
@Directive({ selector: 'ng-template[nxCell]' })
export class NxCell {
  readonly column = input.required<string>({ alias: 'nxCell' });
  readonly template = inject<TemplateRef<{ $implicit: unknown }>>(TemplateRef);
}

/**
 * Server-driven table: it renders what it is given and emits sort requests;
 * the page owns the data (URL params -> service -> rows). No client-side sorting.
 *
 * Rows are clickable for mouse users (rowLink); keyboard users use the real link
 * the page puts in the primary cell, so there is exactly one focus stop per row.
 */
@Component({
  selector: 'nx-data-table',
  imports: [NgTemplateOutlet, Icon, Skeleton],
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss',
})
export class DataTable<T extends object> {
  readonly columns = input.required<readonly TableColumn[]>();
  readonly rows = input.required<readonly T[]>();
  readonly caption = input.required<string>();
  readonly loading = input(false);
  readonly sort = input('');
  readonly dir = input<SortDir>('asc');
  readonly rowLink = input<((row: T) => unknown[]) | null>(null);
  readonly emptyMessage = input('No records match the current filters.');

  readonly sortChange = output<SortChange>();

  private readonly router = inject(Router);
  private readonly cells = contentChildren(NxCell);

  /** column key -> template, recomputed only when the projected templates change */
  protected readonly cellTemplates = computed(() => {
    const map = new Map<string, TemplateRef<{ $implicit: unknown }>>();
    for (const cell of this.cells()) map.set(cell.column(), cell.template);
    return map;
  });

  protected readonly skeletonRows = [0, 1, 2, 3, 4, 5];
  protected readonly showSkeleton = computed(() => this.loading() && this.rows().length === 0);

  protected ariaSort(col: TableColumn): 'ascending' | 'descending' | 'none' | null {
    if (!col.sortable) return null;
    if (this.sort() !== col.key) return 'none';
    return this.dir() === 'asc' ? 'ascending' : 'descending';
  }

  protected toggleSort(col: TableColumn): void {
    const dir: SortDir = this.sort() === col.key && this.dir() === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit({ sort: col.key, dir });
  }

  protected value(row: T, key: string): unknown {
    return (row as Record<string, unknown>)[key];
  }

  protected onRowClick(row: T, event: MouseEvent): void {
    const link = this.rowLink();
    // Let real links/buttons inside the row (and new-tab clicks) behave normally.
    const target = event.target as HTMLElement;
    if (!link || target.closest('a, button, input, select') || event.metaKey || event.ctrlKey)
      return;
    void this.router.navigate(link(row));
  }
}
