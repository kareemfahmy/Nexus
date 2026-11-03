import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DataTable, NxCell, SortChange, TableColumn } from './data-table';

interface Row {
  id: string;
  name: string;
  status: string;
}

@Component({
  imports: [DataTable, NxCell],
  template: `
    <nx-data-table
      caption="Test rows"
      [columns]="columns"
      [rows]="rows()"
      [sort]="'name'"
      [dir]="'asc'"
      (sortChange)="last = $event"
    >
      <ng-template nxCell="status" let-row
        ><b class="custom">{{ row.status }}</b></ng-template
      >
    </nx-data-table>
  `,
})
class Host {
  columns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
  ];
  rows = signal<Row[]>([{ id: '1', name: 'Alpha', status: 'active' }]);
  last: SortChange | null = null;
}

describe('DataTable', () => {
  async function render() {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('exposes the current sort with aria-sort', async () => {
    const { el } = await render();
    const headers = el.querySelectorAll('th');
    expect(headers[0].getAttribute('aria-sort')).toBe('ascending');
    expect(headers[1].getAttribute('aria-sort')).toBe('none');
  });

  it('requests the opposite direction when the active column is clicked', async () => {
    const { el, fixture } = await render();
    el.querySelector<HTMLButtonElement>('th button')!.click();
    expect(fixture.componentInstance.last).toEqual({ sort: 'name', dir: 'desc' });
  });

  it('renders projected cell templates and falls back to the raw value', async () => {
    const { el } = await render();
    expect(el.querySelector('.custom')?.textContent).toBe('active');
    expect(el.querySelector('tbody td')?.textContent?.trim()).toBe('Alpha');
  });

  it('shows the empty message when there are no rows', async () => {
    const { el, fixture } = await render();
    fixture.componentInstance.rows.set([]);
    await fixture.whenStable();
    expect(el.querySelector('.empty')?.textContent).toContain('No records');
  });
});
