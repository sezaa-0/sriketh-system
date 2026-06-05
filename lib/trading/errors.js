/**
 * @param {unknown} error
 * @returns {string}
 */
export function formatSupabaseError(error) {
  if (!error) return "Unknown database error";

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const e = /** @type {{ message?: string; details?: string; hint?: string; code?: string }} */ (
      error
    );
    return [e.message, e.details, e.hint, e.code].filter(Boolean).join(" — ");
  }

  return String(error);
}

/**
 * @param {unknown} error
 */
export function logSupabaseError(context, error, payload) {
  console.error(`Supabase Insert Error Detailed (${context}):`, error);
  if (payload) {
    console.error(`Supabase payload (${context}):`, payload);
  }
}
