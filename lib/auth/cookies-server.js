import { cookies } from "next/headers";
import {
  AUTH_COOKIE_ACCESS,
  AUTH_COOKIE_REFRESH,
  AUTH_COOKIE_ROLE,
  AUTH_COOKIE_USERNAME,
  AUTH_ROLES,
  SESSION_COOKIE_OPTIONS,
} from "@/lib/auth/constants";

const AUTH_COOKIE_NAMES = [
  AUTH_COOKIE_ROLE,
  AUTH_COOKIE_USERNAME,
  AUTH_COOKIE_ACCESS,
  AUTH_COOKIE_REFRESH,
];

/**
 * @param {import("next/headers").ResponseCookies} cookieStore
 * @param {{
 *   role: string;
 *   username: string;
 *   accessToken?: string;
 *   refreshToken?: string;
 * }} session
 */
export function setAuthSessionCookies(cookieStore, session) {
  cookieStore.set(AUTH_COOKIE_ROLE, session.role, SESSION_COOKIE_OPTIONS);
  cookieStore.set(AUTH_COOKIE_USERNAME, session.username, SESSION_COOKIE_OPTIONS);

  if (session.role === AUTH_ROLES.USER && session.accessToken && session.refreshToken) {
    cookieStore.set(AUTH_COOKIE_ACCESS, session.accessToken, SESSION_COOKIE_OPTIONS);
    cookieStore.set(AUTH_COOKIE_REFRESH, session.refreshToken, SESSION_COOKIE_OPTIONS);
  } else {
    cookieStore.delete(AUTH_COOKIE_ACCESS);
    cookieStore.delete(AUTH_COOKIE_REFRESH);
  }
}

/** @param {import("next/headers").ResponseCookies} cookieStore */
export function clearAuthSessionCookies(cookieStore) {
  for (const name of AUTH_COOKIE_NAMES) {
    cookieStore.delete(name);
  }
}

export function getServerCookieStore() {
  return cookies();
}
