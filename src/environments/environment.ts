// Production build configuration.
// The Supabase URL and publishable key are PUBLIC by design: every browser that loads the app sees them.
// Data is protected by Row Level Security policies in Postgres, not by hiding this key.
// NEVER put the service-role key (or any secret) in a frontend environment file.
export const environment = {
  production: true,
  supabase: {
    url: 'https://csblzgxsskyfpgsevlgd.supabase.co',
    publishableKey: 'sb_publishable_6_kebeJLSj4OI1TLU9vQsA_WxDSW3Wz',
  },
} as const;
