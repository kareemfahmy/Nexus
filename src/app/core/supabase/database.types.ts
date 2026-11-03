// PLACEHOLDER until Milestone 2b.
// This file is regenerated from the live schema after every migration
// (Supabase MCP `generate_typescript_types`). Do not edit by hand once generated.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: 'viewer' | 'operator' | 'admin';
    };
    CompositeTypes: Record<string, never>;
  };
};
