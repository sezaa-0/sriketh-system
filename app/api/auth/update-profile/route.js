import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_ACCESS,
  AUTH_COOKIE_REFRESH,
  AUTH_COOKIE_ROLE,
  AUTH_COOKIE_USERNAME,
  AUTH_ROLES,
} from "@/lib/auth/constants";
import {
  getServerCookieStore,
  setAuthSessionCookies,
} from "@/lib/auth/cookies-server";
import { isAuthenticatedFromCookies } from "@/lib/auth/session";
import { createAuthSupabaseClient } from "@/lib/auth/supabase-server";

export async function POST(request) {
  const cookieStore = getServerCookieStore();

  if (!isAuthenticatedFromCookies(cookieStore)) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const role = cookieStore.get(AUTH_COOKIE_ROLE)?.value;
  if (role === AUTH_ROLES.ADMIN) {
    return NextResponse.json(
      { error: "Administrator sessions use fixed credentials and cannot be updated here." },
      { status: 400 }
    );
  }

  const access = cookieStore.get(AUTH_COOKIE_ACCESS)?.value;
  const refresh = cookieStore.get(AUTH_COOKIE_REFRESH)?.value;
  if (!access || !refresh) {
    return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
  }

  const body = await request.json();
  const nextUsername = String(body.username ?? "").trim();
  const nextPassword = String(body.password ?? "");

  if (!nextUsername && !nextPassword) {
    return NextResponse.json({ error: "Provide a new username and/or password." }, { status: 400 });
  }

  if (nextPassword && nextPassword.length < 4) {
    return NextResponse.json(
      { error: "Password must be at least 4 characters." },
      { status: 400 }
    );
  }

  let accessToken = access;
  let refreshToken = refresh;

  if (nextPassword) {
    const supabase = createAuthSupabaseClient();
    const { error: sessionErr } = await supabase.auth.setSession({
      access_token: access,
      refresh_token: refresh,
    });
    if (sessionErr) {
      return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
    }

    const { data, error } = await supabase.auth.updateUser({ password: nextPassword });
    if (error) {
      return NextResponse.json(
        { error: error.message || "Could not update password." },
        { status: 400 }
      );
    }

    if (data.session) {
      accessToken = data.session.access_token;
      refreshToken = data.session.refresh_token;
    }
  }

  const resolvedUsername =
    nextUsername ||
    cookieStore.get(AUTH_COOKIE_USERNAME)?.value ||
    "";

  const response = NextResponse.json({
    ok: true,
    username: resolvedUsername,
    passwordUpdated: Boolean(nextPassword),
    usernameUpdated: Boolean(nextUsername),
  });

  setAuthSessionCookies(response.cookies, {
    role: AUTH_ROLES.USER,
    username: resolvedUsername,
    accessToken,
    refreshToken,
  });

  return response;
}
