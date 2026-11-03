import { computed, inject, Service, signal } from '@angular/core';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.client';
import { Database } from '../supabase/database.types';

export type AppRole = Database['public']['Enums']['app_role'];

const ROLE_RANK: Record<AppRole, number> = { viewer: 0, operator: 1, admin: 2 };

/**
 * Owns the authentication session and the user's role, exposed as signals.
 *
 * Flow: Supabase restores the session from localStorage → `init()` reads it and loads the role
 * from `public.profiles` → `onAuthStateChange` keeps both in sync (sign-in, sign-out, refresh).
 * Everything else (guards, topbar, role checks) derives from these with `computed()`.
 *
 * This is the one core service allowed to query Supabase directly (auth is app infrastructure,
 * not a feature). IMPORTANT: role checks here only shape the UI; Postgres RLS is the enforcement.
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

  /** Resolves once the stored session and role have been loaded. Guards await this. Idempotent. */
  init(): Promise<void> {
    this.initPromise ??= this.restoreSession();
    return this.initPromise;
  }

  hasRole(min: AppRole): boolean {
    return ROLE_RANK[this.role()] >= ROLE_RANK[min];
  }

  async signInWithPassword(email: string, password: string): Promise<void> {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await this.applySession(data.session); // role is known before we navigate
  }

  /** "Explore the demo": anonymous Supabase session, always read-only (viewer). */
  async signInAsGuest(): Promise<void> {
    const { data, error } = await this.supabase.auth.signInAnonymously();
    if (error) throw error;
    await this.applySession(data.session);
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
    await this.applySession(null);
  }

  private async restoreSession(): Promise<void> {
    const { data } = await this.supabase.auth.getSession();
    await this.applySession(data.session);
    this.supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session) => {
      // Supabase warns against awaiting other Supabase calls inside this callback (it can
      // deadlock the auth lock), so the role lookup is deferred to the next macrotask.
      setTimeout(() => void this.applySession(session));
    });
    this.readySignal.set(true);
  }

  private async applySession(session: Session | null): Promise<void> {
    this.sessionSignal.set(session);
    this.roleSignal.set(await this.loadRole(session));
  }

  /** Guests and signed-out users are viewers; real users read their row in public.profiles. */
  private async loadRole(session: Session | null): Promise<AppRole> {
    const user = session?.user;
    if (!user || user.is_anonymous) return 'viewer';
    const { data, error } = await this.supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (error || !data) return 'viewer'; // fail closed: least privilege
    return data.role;
  }
}
