import { createClient } from "@supabase/supabase-js";

function getSupabaseUrl() {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

/**
 * Server-side Supabase client for auth API routes.
 */
export function createAuthSupabaseClient() {
  const url = getSupabaseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
