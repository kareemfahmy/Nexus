import { Component, input } from '@angular/core';
import { EmptyState } from './empty-state';
import { PageHeader } from './page-header';

/**
 * Temporary page used by feature routes until their milestone ships.
 * `title`, `milestone` and `summary` arrive from route `data` via withComponentInputBinding().
 */
@Component({
  selector: 'nx-placeholder-page',
  imports: [EmptyState, PageHeader],
  template: `
    <nx-page-header [title]="title()" />
    <nx-empty-state
      icon="construction"
      [heading]="title() + ' arrives in Milestone ' + milestone()"
      [message]="summary()"
    />
  `,
})
export default class PlaceholderPage {
  readonly title = input.required<string>();
  readonly milestone = input.required<string>();
  readonly summary = input('');
}
