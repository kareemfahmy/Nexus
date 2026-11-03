import { describeError } from './app-error';
import { ilikeAny, oneOf, pageRange, toPage } from './list-query';

describe('list query helpers', () => {
  it('computes inclusive ranges for 1-based pages', () => {
    expect(pageRange({ page: 1, pageSize: 25 })).toEqual([0, 24]);
    expect(pageRange({ page: 3, pageSize: 25 })).toEqual([50, 74]);
  });

  it('strips PostgREST syntax and LIKE wildcards from search input', () => {
    expect(ilikeAny(['name', 'code'], 'a,b(c)%_')).toBe('name.ilike.%a b c%,code.ilike.%a b c%');
  });

  it('only accepts whitelisted sort columns from the URL', () => {
    expect(oneOf('name', ['name', 'code'] as const, 'code')).toBe('name');
    expect(oneOf('password;drop', ['name', 'code'] as const, 'code')).toBe('code');
  });

  it('parses page params defensively', () => {
    expect(toPage('4')).toBe(4);
    expect(toPage('-1')).toBe(1);
    expect(toPage(undefined)).toBe(1);
  });
});

describe('describeError', () => {
  it('explains RLS denials as read-only access', () => {
    expect(
      describeError({ code: '42501', message: 'new row violates row-level security' }),
    ).toMatch(/read-only/);
  });

  it('passes through business-rule messages from triggers', () => {
    expect(
      describeError({
        code: '23514',
        message: 'Invalid work order status change: open -> completed',
      }),
    ).toContain('open -> completed');
  });

  it('treats network failures as connectivity problems', () => {
    expect(describeError(new TypeError('Failed to fetch'))).toMatch(/reach the server/);
  });
});
