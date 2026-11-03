import { InjectionToken } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { Database } from './database.types';

/** The typed Supabase client used across the app. */
export type NexusSupabaseClient = SupabaseClient<Database>;

/**
 * Dependency-injection token for the single Supabase client.
 *
 * Why a token instead of `createClient()` at the top of each service?
 *  - One client instance for the whole app (one auth session, one connection pool).
 *  - Tests can swap in a fake with `{ provide: SUPABASE_CLIENT, useValue: fake }`.
 *  - `providedIn: 'root'` + `factory` means Angular creates it lazily on first `inject()`.
 *
 * Only data-access services (features/*\/data/*.service.ts) and AuthService should inject this.
 */
export const SUPABASE_CLIENT = new InjectionToken<NexusSupabaseClient>('SUPABASE_CLIENT', {
  providedIn: 'root',
  factory: () =>
    createClient<Database>(environment.supabase.url, environment.supabase.publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }),
});
