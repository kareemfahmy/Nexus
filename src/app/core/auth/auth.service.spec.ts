import { TestBed } from '@angular/core/testing';
import type { Session } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.client';
import { AuthService } from './auth.service';

/** Minimal fake of the parts of the Supabase client AuthService uses. */
function fakeSupabase(session: Session | null) {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session } }),
      onAuthStateChange: vi.fn(),
      signInAnonymously: vi.fn().mockResolvedValue({ error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  };
}

function sessionFor(user: Partial<Session['user']>): Session {
  return { user: { id: 'u1', ...user } } as Session;
}

function setup(session: Session | null) {
  const supabase = fakeSupabase(session);
  TestBed.configureTestingModule({ providers: [{ provide: SUPABASE_CLIENT, useValue: supabase }] });
  return { auth: TestBed.inject(AuthService), supabase };
}

describe('AuthService', () => {
  it('is unauthenticated when no session is stored', async () => {
    const { auth } = setup(null);
    await auth.init();
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.ready()).toBe(true);
  });

  it('treats anonymous users as read-only guests', async () => {
    const { auth } = setup(sessionFor({ is_anonymous: true }));
    await auth.init();
    expect(auth.isGuest()).toBe(true);
    expect(auth.role()).toBe('viewer');
    expect(auth.canWrite()).toBe(false);
    expect(auth.displayName()).toBe('Guest');
  });

  it('reads the stored session only once even if init() is called repeatedly', async () => {
    const { auth, supabase } = setup(null);
    await Promise.all([auth.init(), auth.init(), auth.init()]);
    expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);
  });

  it('surfaces Supabase errors from guest sign-in', async () => {
    const { auth, supabase } = setup(null);
    supabase.auth.signInAnonymously.mockResolvedValue({
      error: new Error('Anonymous sign-ins are disabled'),
    });
    await expect(auth.signInAsGuest()).rejects.toThrow(/disabled/);
  });
});
