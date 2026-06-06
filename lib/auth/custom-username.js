export const CUSTOM_USERNAME_STORAGE_KEY = "custom_sys_username";
export const DEFAULT_CUSTOM_USERNAME = "uncle";

/** @returns {boolean} */
export function isBrowser() {
  return typeof window !== "undefined";
}

/** Ensure the default custom username exists in localStorage. */
export function ensureCustomUsernameDefault() {
  if (!isBrowser()) return DEFAULT_CUSTOM_USERNAME;
  const existing = window.localStorage.getItem(CUSTOM_USERNAME_STORAGE_KEY);
  if (!existing?.trim()) {
    window.localStorage.setItem(CUSTOM_USERNAME_STORAGE_KEY, DEFAULT_CUSTOM_USERNAME);
    return DEFAULT_CUSTOM_USERNAME;
  }
  return existing.trim();
}

/** @returns {string} */
export function getCustomUsername() {
  if (!isBrowser()) return DEFAULT_CUSTOM_USERNAME;
  return ensureCustomUsernameDefault();
}

/** @param {string} username */
export function setCustomUsername(username) {
  if (!isBrowser()) return;
  const trimmed = String(username ?? "").trim();
  if (!trimmed) return;
  window.localStorage.setItem(CUSTOM_USERNAME_STORAGE_KEY, trimmed);
}

/** @param {string} enteredUsername */
export function matchesCustomUsername(enteredUsername) {
  const expected = getCustomUsername();
  return String(enteredUsername ?? "").trim() === expected;
}
