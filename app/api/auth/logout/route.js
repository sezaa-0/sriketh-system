import { NextResponse } from "next/server";
import { clearAuthSessionCookies, getServerCookieStore } from "@/lib/auth/cookies-server";
import {
  AUTH_COOKIE_ACCESS,
  AUTH_COOKIE_REFRESH,
  AUTH_COOKIE_ROLE,
  AUTH_ROLES,
} from "@/lib/auth/constants";
import { createAuthSupabaseClient } from "@/lib/auth/supabase-server";

export async function POST() {
  const cookieStore = getServerCookieStore();
  const role = cookieStore.get(AUTH_COOKIE_ROLE)?.value;

  if (role === AUTH_ROLES.USER) {
    const access = cookieStore.get(AUTH_COOKIE_ACCESS)?.value;
    const refresh = cookieStore.get(AUTH_COOKIE_REFRESH)?.value;
    if (access && refresh) {
      try {
        const supabase = createAuthSupabaseClient();
        await supabase.auth.setSession({
          access_token: access,
          refresh_token: refresh,
        });
        await supabase.auth.signOut();
      } catch {
        /* ignore sign-out errors */
      }
    }
  }

  const response = NextResponse.json({ ok: true });
  clearAuthSessionCookies(response.cookies);
  return response;
}
