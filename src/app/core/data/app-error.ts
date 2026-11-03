/**
 * Converts Supabase/PostgREST/network errors into messages a user can act on.
 * Postgres error codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
interface CodedError {
  code?: string;
  message?: string;
}

function isCoded(err: unknown): err is CodedError {
  return typeof err === 'object' && err !== null && ('code' in err || 'message' in err);
}

export function describeError(err: unknown): string {
  if (err instanceof DOMException && err.name === 'AbortError') return '';
  if (err instanceof TypeError) {
    return "Can't reach the server. Check your connection and try again.";
  }
  if (!isCoded(err)) return 'Something went wrong. Please try again.';

  switch (err.code) {
    case '42501': // insufficient_privilege (RLS)
      return 'You have read-only access. An operator account is required to make changes.';
    case '23505': // unique_violation
      return 'A record with this identifier already exists. Use a different value.';
    case '23503': // foreign_key_violation
      return 'This record is still linked to other records. Remove those links first.';
    case '23514': // check_violation (incl. our workflow triggers, whose messages are written for users)
      return err.message ?? 'This change breaks a business rule.';
    case 'PGRST116': // .single() found no row (or RLS hid it)
      return 'This record does not exist or you do not have access to it.';
    default:
      return err.message || 'Something went wrong. Please try again.';
  }
}

/** True when the error means "not found", so pages can render a not-found state instead of an error. */
export function isNotFound(err: unknown): boolean {
  return isCoded(err) && err.code === 'PGRST116';
}
