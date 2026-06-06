export const SYSTEM_AUTH_EMAIL = "user@system.com";

export const ADMIN_USERNAME = "admin";
export const ADMIN_PASSWORD = "1234";

export const AUTH_COOKIE_ROLE = "sk_auth_role";
export const AUTH_COOKIE_USERNAME = "sk_username";
export const AUTH_COOKIE_ACCESS = "sk_access_token";
export const AUTH_COOKIE_REFRESH = "sk_refresh_token";

/** Session cookies — no maxAge so they expire when the browser closes. */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

export const AUTH_ROLES = {
  ADMIN: "admin",
  USER: "user",
};
