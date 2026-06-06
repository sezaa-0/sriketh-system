import {
  AUTH_COOKIE_ACCESS,
  AUTH_COOKIE_REFRESH,
  AUTH_COOKIE_ROLE,
  AUTH_COOKIE_USERNAME,
  AUTH_ROLES,
} from "@/lib/auth/constants";

/**
 * @param {{ get: (name: string) => { value: string } | undefined }} cookieStore
 */
export function isAuthenticatedFromCookies(cookieStore) {
  const role = cookieStore.get(AUTH_COOKIE_ROLE)?.value;
  if (role === AUTH_ROLES.ADMIN) return true;
  if (role === AUTH_ROLES.USER) {
    return Boolean(
      cookieStore.get(AUTH_COOKIE_ACCESS)?.value &&
        cookieStore.get(AUTH_COOKIE_REFRESH)?.value
    );
  }
  return false;
}

/**
 * @param {{ get: (name: string) => { value: string } | undefined }} cookieStore
 */
export function readAuthSession(cookieStore) {
  const role = cookieStore.get(AUTH_COOKIE_ROLE)?.value ?? null;
  const username = cookieStore.get(AUTH_COOKIE_USERNAME)?.value ?? null;
  return {
    authenticated: isAuthenticatedFromCookies(cookieStore),
    role,
    username,
  };
}
