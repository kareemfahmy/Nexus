import { computed, inject, Service, signal } from '@angular/core';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.client';
import { Database } from '../supabase/database.types';

export type AppRole = Database['public']['Enums']['app_role'];

const ROLE_RANK: Record<AppRole, number> = { viewer: 0, operator: 1, admin: 2 };

/**
 * Owns the authentication session and exposes it as signals.
 *
 * Flow: Supabase restores the session from localStorage → `init()` reads it →
 * `onAuthStateChange` keeps the `session` signal in sync (sign-in, sign-out, token refresh).
 * Everything else (guards, topbar, role checks) derives from `session` with `computed()`.
 *
 * IMPORTANT: role checks here only shape the UI. Postgres RLS is the real enforcement.
 */
@Service()
export class AuthService {
  private readonly supabase = inject(SUPABASE_CLIENT);

  private readonly sessionSignal = signal<Session | null>(null);
  private readonly roleSignal = signal<AppRole>('viewer');
  private readonly readySignal = signal(false);

  readonly session = this.sessionSignal.asReadonly();
  readonly ready = this.readySignal.asReadonly();
  readonly user = computed(() => this.sessionSignal()?.user ?? null);
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly isGuest = computed(() => this.user()?.is_anonymous === true);
  readonly role = computed<AppRole>(() => (this.isGuest() ? 'viewer' : this.roleSignal()));
  readonly canWrite = computed(() => this.hasRole('operator'));
  readonly displayName = computed(() => {
    const u = this.user();
    if (!u) return '';
    if (u.is_anonymous) return 'Guest';
    const fullName = u.user_metadata?.['full_name'];
    return typeof fullName === 'string' && fullName ? fullName : (u.email ?? 'User');
  });

  private initPromise: Promise<void> | null = null;

  /** Resolves once the stored session has been read. Guards await this. Safe to call repeatedly. */
  init(): Promise<void> {
    this.initPromise ??= this.restoreSession();
    return this.initPromise;
  }

  hasRole(min: AppRole): boolean {
    return ROLE_RANK[this.role()] >= ROLE_RANK[min];
  }

  async signInWithPassword(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  /** "Explore the demo": anonymous Supabase session, always read-only (viewer). */
  async signInAsGuest(): Promise<void> {
    const { error } = await this.supabase.auth.signInAnonymously();
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }

  private async restoreSession(): Promise<void> {
    const { data } = await this.supabase.auth.getSession();
    this.applySession(data.session);
    this.supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session) =>
      this.applySession(session),
    );
    this.readySignal.set(true);
  }

  private applySession(session: Session | null): void {
    this.sessionSignal.set(session);
    // TODO(M2b): load the role from public.profiles once the table exists.
    // Until then every signed-in user is treated as a viewer in the UI.
    this.roleSignal.set('viewer');
  }
}
