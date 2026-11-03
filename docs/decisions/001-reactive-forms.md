# ADR-001: Use typed Reactive Forms instead of Signal Forms

- **Status:** Accepted (Milestone 1)
- **Context:** Angular 22 marks Signal Forms (`@angular/forms/signals`) as stable, and both the angular-developer skill and the CLI-generated rules recommend them for new apps. Nexus is also a portfolio piece for Angular job applications.

## Decision
Use **typed Reactive Forms** (`FormBuilder.nonNullable`, `FormGroup`, `Validators`) for all forms.

## Reasons
- Most existing Angular codebases, and therefore most interview questions, use Reactive Forms. Signal Forms are brand new.
- Mature ecosystem: validators, `ControlValueAccessor` custom controls and testing patterns are well documented.
- Typed, non-nullable controls give compile-time safety close to Signal Forms.

## Consequences
- Bridge to signals where templates need derived state: `toSignal(form.valueChanges)` or `toSignal(form.statusChanges)`.
- Migrating to Signal Forms later is possible per form, because forms are isolated inside feature components.
- `CLAUDE.md` overrides the CLI's Signal Forms rule so generated code stays consistent.
