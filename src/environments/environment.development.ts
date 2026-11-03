// Development build configuration (swapped in by angular.json fileReplacements for `ng serve`).
// Points at the same hosted demo project for now; switch `url` to http://127.0.0.1:54321
// when using the local Supabase CLI stack.
export const environment = {
  production: false,
  supabase: {
    url: 'https://csblzgxsskyfpgsevlgd.supabase.co',
    publishableKey: 'sb_publishable_6_kebeJLSj4OI1TLU9vQsA_WxDSW3Wz',
  },
} as const;
