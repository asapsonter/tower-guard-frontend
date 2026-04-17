/**
 * @tower-guard/supabase-client
 *
 * Lazy-initialized Supabase client shared across all 4 apps.
 *
 * If VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set, the
 * client is created on first access. If they're missing, `supabase` is
 * `null` and features that depend on it (realtime subscriptions, dispatch,
 * storage uploads) gracefully degrade instead of crashing the app.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@tower-guard/data";

let _client: SupabaseClient<Database> | null = null;
let _initialized = false;

function getClient(): SupabaseClient<Database> | null {
  if (_initialized) return _client;
  _initialized = true;

  const env = (import.meta as unknown as { env: Record<string, string | undefined> }).env;
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn(
      "[@tower-guard/supabase-client] Supabase env vars not set " +
      "(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY). " +
      "Realtime, dispatch, and storage features will be disabled.",
    );
    return null;
  }

  _client = createClient<Database>(url, key, {
    auth: {
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return _client;
}

export const supabase: SupabaseClient<Database> | null = getClient();

export type { SupabaseClient, Database };
