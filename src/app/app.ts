import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Root component: just the router outlet. Layout lives in core/layout/app-shell. */
@Component({
  selector: 'nx-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {}
