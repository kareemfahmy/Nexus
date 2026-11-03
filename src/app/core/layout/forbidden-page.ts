import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '../../shared/ui/button';
import { EmptyState } from '../../shared/ui/empty-state';

@Component({
  selector: 'nx-forbidden-page',
  imports: [EmptyState, Button, RouterLink],
  template: `
    <nx-empty-state
      [level]="1"
      icon="lock"
      heading="This action needs an operator account"
      message="You're signed in with read-only access. Browsing is unrestricted, but creating and editing records requires the operator role."
    >
      <a nxButton routerLink="/dashboard">Back to dashboard</a>
    </nx-empty-state>
  `,
})
export default class ForbiddenPage {}
