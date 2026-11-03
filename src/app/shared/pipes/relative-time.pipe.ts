import { Pipe, PipeTransform } from '@angular/core';
import { formatDistanceToNowStrict } from 'date-fns';

/**
 * '2026-11-03T10:00:00Z' -> '12 minutes ago'.
 * Pure pipe: recalculates when the input changes, not every second. Good enough for "last seen";
 * the page re-renders on navigation/refresh. Pair it with a <time> element carrying the exact time.
 */
@Pipe({ name: 'relativeTime' })
export class RelativeTimePipe implements PipeTransform {
  transform(value: string | null | undefined, fallback = 'Never'): string {
    if (!value) return fallback;
    return formatDistanceToNowStrict(new Date(value), { addSuffix: true });
  }
}

/** Plain-function version for TypeScript code (avoid injecting pipes into classes). */
export function isStale(value: string | null | undefined, minutes: number): boolean {
  return !value || Date.now() - new Date(value).getTime() > minutes * 60_000;
}
