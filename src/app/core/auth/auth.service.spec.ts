import { TestBed } from '@angular/core/testing';
import type { Session } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.client';
import { AuthService } from './auth.service';

type ProfileResult = { data: { role: string } | null; error: Error | null };

/** Minimal fake of the parts of the Supabase client AuthService uses. */
function fakeSupabase(
  session: Session | null,
  profile: ProfileResult = { data: null, error: null },
) {
  const maybeSingle = vi.fn().mockResolvedValue(profile);
  const from = vi.fn(() => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }));
  return {
    from,
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session } }),
      onAuthStateChange: vi.fn(),
      signInAnonymously: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  };
}

function sessionFor(user: Partial<Session['user']>): Session {
  return { user: { id: 'u1', ...user } } as Session;
}

function setup(session: Session | null, profile?: ProfileResult) {
  const supabase = fakeSupabase(session, profile);
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

  it('treats anonymous users as read-only guests without querying profiles', async () => {
    const { auth, supabase } = setup(sessionFor({ is_anonymous: true }));
    await auth.init();
    expect(auth.isGuest()).toBe(true);
    expect(auth.role()).toBe('viewer');
    expect(auth.canWrite()).toBe(false);
    expect(auth.displayName()).toBe('Guest');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('loads the role of a signed-in user from public.profiles', async () => {
    const { auth, supabase } = setup(sessionFor({ email: 'op@example.com' }), {
      data: { role: 'operator' },
      error: null,
    });
    await auth.init();
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(auth.role()).toBe('operator');
    expect(auth.canWrite()).toBe(true);
    expect(auth.hasRole('admin')).toBe(false);
  });

  it('fails closed to viewer when the profile cannot be read', async () => {
    const { auth } = setup(sessionFor({ email: 'x@example.com' }), {
      data: null,
      error: new Error('network down'),
    });
    await auth.init();
    expect(auth.role()).toBe('viewer');
    expect(auth.canWrite()).toBe(false);
  });

  it('reads the stored session only once even if init() is called repeatedly', async () => {
    const { auth, supabase } = setup(null);
    await Promise.all([auth.init(), auth.init(), auth.init()]);
    expect(supabase.auth.getSession).toHaveBeenCalledTimes(1);
  });

  it('surfaces Supabase errors from guest sign-in', async () => {
    const { auth, supabase } = setup(null);
    supabase.auth.signInAnonymously.mockResolvedValue({
      data: { session: null },
      error: new Error('Anonymous sign-ins are disabled'),
    });
    await expect(auth.signInAsGuest()).rejects.toThrow(/disabled/);
  });
});
