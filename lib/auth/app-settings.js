import { supabase } from "@/lib/supabase";

export const DEFAULT_CUSTOM_USERNAME = "uncle";
export const APP_SETTINGS_ROW_ID = 1;

/**
 * Fetch the active custom login username from app_settings.
 * @param {import('@supabase/supabase-js').SupabaseClient} [client]
 * @returns {Promise<string>}
 */
export async function fetchCustomUsernameFromSettings(client = supabase) {
  try {
    const { data, error } = await client
      .from("app_settings")
      .select("custom_username")
      .eq("id", APP_SETTINGS_ROW_ID)
      .maybeSingle();

    if (error) throw error;

    const trimmed = String(data?.custom_username ?? "").trim();
    return trimmed || DEFAULT_CUSTOM_USERNAME;
  } catch {
    return DEFAULT_CUSTOM_USERNAME;
  }
}

/** @returns {Promise<string>} */
export async function fetchCustomUsername() {
  return fetchCustomUsernameFromSettings(supabase);
}

/**
 * Persist a new custom login username to app_settings.
 * @param {string} newUsername
 * @returns {Promise<string>}
 */
export async function updateCustomUsernameInSettings(newUsername) {
  const trimmed = String(newUsername ?? "").trim();
  if (!trimmed) {
    throw new Error("Username cannot be empty.");
  }

  const { error } = await supabase
    .from("app_settings")
    .update({ custom_username: trimmed })
    .eq("id", APP_SETTINGS_ROW_ID);

  if (error) throw error;
  return trimmed;
}
