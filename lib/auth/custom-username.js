export const CUSTOM_USERNAME_STORAGE_KEY = "custom_sys_username";
export const DEFAULT_CUSTOM_USERNAME = "uncle";

/** @returns {boolean} */
export function isBrowser() {
  return typeof window !== "undefined";
}

/**
 * Read the expected login username from localStorage.
 * Falls back to DEFAULT_CUSTOM_USERNAME when missing, empty, or unreadable.
 * Does not write to storage — safe for first login on a new device/browser.
 * @returns {string}
 */
export function getExpectedLoginUsername() {
  if (!isBrowser()) return DEFAULT_CUSTOM_USERNAME;
  try {
    const raw = window.localStorage.getItem(CUSTOM_USERNAME_STORAGE_KEY);
    const trimmed = String(raw ?? "").trim();
    return trimmed || DEFAULT_CUSTOM_USERNAME;
  } catch {
    return DEFAULT_CUSTOM_USERNAME;
  }
}

/** Ensure the default custom username exists in localStorage. */
export function ensureCustomUsernameDefault() {
  if (!isBrowser()) return DEFAULT_CUSTOM_USERNAME;
  try {
    const existing = window.localStorage.getItem(CUSTOM_USERNAME_STORAGE_KEY);
    if (!existing?.trim()) {
      window.localStorage.setItem(CUSTOM_USERNAME_STORAGE_KEY, DEFAULT_CUSTOM_USERNAME);
      return DEFAULT_CUSTOM_USERNAME;
    }
    return existing.trim();
  } catch {
    return DEFAULT_CUSTOM_USERNAME;
  }
}

/** @returns {string} */
export function getCustomUsername() {
  return getExpectedLoginUsername();
}

/** @param {string} username */
export function setCustomUsername(username) {
  if (!isBrowser()) return;
  try {
    const trimmed = String(username ?? "").trim();
    if (!trimmed) return;
    window.localStorage.setItem(CUSTOM_USERNAME_STORAGE_KEY, trimmed);
  } catch {
    /* storage blocked — ignore */
  }
}

/**
 * Persist username to localStorage after a successful login on a new device.
 * @param {string} username
 */
export function persistUsernameAfterLogin(username) {
  if (!isBrowser()) return;
  try {
    const trimmed = String(username ?? "").trim();
    if (!trimmed) return;
    const existing = window.localStorage.getItem(CUSTOM_USERNAME_STORAGE_KEY);
    if (!existing?.trim()) {
      window.localStorage.setItem(CUSTOM_USERNAME_STORAGE_KEY, trimmed);
    }
  } catch {
    /* storage blocked — ignore */
  }
}

/** @param {string} enteredUsername */
export function matchesCustomUsername(enteredUsername) {
  const expected = getExpectedLoginUsername();
  return String(enteredUsername ?? "").trim() === expected;
}
