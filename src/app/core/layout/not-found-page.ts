import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '../../shared/ui/button';
import { EmptyState } from '../../shared/ui/empty-state';

@Component({
  selector: 'nx-not-found-page',
  imports: [EmptyState, Button, RouterLink],
  template: `
    <nx-empty-state
      icon="search"
      heading="Page not found"
      message="The link may be outdated or the record may have been removed."
    >
      <a nxButton variant="primary" routerLink="/dashboard">Go to dashboard</a>
    </nx-empty-state>
  `,
})
export default class NotFoundPage {}
