/**
 * Shared shapes and helpers for server-side lists (sort, search, filter, paging).
 * Pages read these values from URL query params; data services translate them into Supabase calls.
 */

export type SortDir = 'asc' | 'desc';

export interface ListQuery {
  page: number; // 1-based
  pageSize: number;
  sort: string;
  dir: SortDir;
  q: string;
}

export interface Page<T> {
  rows: T[];
  total: number;
}

export const DEFAULT_PAGE_SIZE = 25;

/** Inclusive `[from, to]` row range for Supabase `.range()`. */
export function pageRange(query: Pick<ListQuery, 'page' | 'pageSize'>): [number, number] {
  const from = (Math.max(1, query.page) - 1) * query.pageSize;
  return [from, from + query.pageSize - 1];
}

/**
 * Builds a PostgREST `or` filter that matches the search term in any of the columns:
 *   ilikeAny(['name', 'code'], 'grill') -> "name.ilike.%grill%,code.ilike.%grill%"
 *
 * PostgREST uses `,` `(` `)` as syntax inside `or=()`, and `%`/`_` are LIKE wildcards, so user
 * input is stripped of those characters. That prevents filter injection and accidental wildcards.
 */
export function ilikeAny(columns: readonly string[], term: string): string {
  const safe = term.replace(/[,()%_*\\]/g, ' ').trim();
  return columns.map((c) => `${c}.ilike.%${safe}%`).join(',');
}

/** Returns `value` if it is one of `allowed`, else `fallback`. Guards sort columns from the URL. */
export function oneOf<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/** Router input transforms: query params arrive as strings or undefined. */
export const toPage = (v: unknown): number => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : 1;
};
export const toText = (v: unknown): string => (typeof v === 'string' ? v : '');
export const toDir = (v: unknown): SortDir => (v === 'desc' ? 'desc' : 'asc');
