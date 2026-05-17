import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;

  const env = (import.meta as { env?: Record<string, string> }).env ?? {};
  const url = env.VITE_SUPABASE_URL ?? "";
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";

  if (!url || !key) {
    throw new Error("Supabase URL and publishable key must be set in environment variables.");
  }

  _client = createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: { "x-kash-version": "2.0" },
    },
  });

  return _client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseClient() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
