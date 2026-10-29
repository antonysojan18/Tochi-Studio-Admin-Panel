import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
// Automatically clean URL to base project URL if /rest/v1 was included
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseUrl.startsWith('http') && 
  (supabaseAnonKey || supabaseServiceKey)
);

let browserClient: SupabaseClient | null = null;
let serverClient: SupabaseClient | null = null;

/**
 * Returns a Supabase client for browser/client-side usage.
 * Returns null if Supabase credentials are not configured.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (browserClient) return browserClient;

  if (supabaseUrl && supabaseAnonKey) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey);
    return browserClient;
  }
  return null;
}

/**
 * Returns an elevated Supabase client for server-side API handlers.
 * Prefers SUPABASE_SERVICE_ROLE_KEY for bypassing RLS on batch writes.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (serverClient) return serverClient;

  const key = supabaseServiceKey || supabaseAnonKey;
  if (supabaseUrl && key) {
    serverClient = createClient(supabaseUrl, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return serverClient;
  }
  return null;
}
