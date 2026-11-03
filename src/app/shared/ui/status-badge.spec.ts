import { TestBed } from '@angular/core/testing';
import { StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  async function render(status: string) {
    const fixture = TestBed.createComponent(StatusBadge);
    fixture.componentRef.setInput('status', status);
    await fixture.whenStable();
    const badge = fixture.nativeElement.querySelector('nx-badge') as HTMLElement;
    return { text: badge.textContent?.trim(), className: badge.className };
  }

  it('maps a known status to its label and tone', async () => {
    const { text, className } = await render('offline');
    expect(text).toBe('Offline');
    expect(className).toContain('tone-danger');
  });

  it('always renders visible text, never colour alone', async () => {
    const { text } = await render('in_progress');
    expect(text).toBe('In progress');
  });

  it('falls back to a neutral, humanised label for unmapped values', async () => {
    const { text, className } = await render('awaiting_parts');
    expect(text).toBe('awaiting parts');
    expect(className).toContain('tone-neutral');
  });
});
