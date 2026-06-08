import { NextResponse } from "next/server";
import {
  ADMIN_PASSWORD,
  ADMIN_USERNAME,
  AUTH_ROLES,
  SYSTEM_AUTH_EMAIL,
} from "@/lib/auth/constants";
import { setAuthSessionCookies } from "@/lib/auth/cookies-server";
import { fetchCustomUsernameFromSettings } from "@/lib/auth/app-settings";
import { createAuthSupabaseClient } from "@/lib/auth/supabase-server";

export async function POST(request) {
  try {
    const body = await request.json();
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");

    if (!username || !password) {
      return NextResponse.json(
        { error: "Invalid Username or Password" },
        { status: 401 }
      );
    }

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const okResponse = NextResponse.json({
        ok: true,
        username: ADMIN_USERNAME,
        role: AUTH_ROLES.ADMIN,
      });
      setAuthSessionCookies(okResponse.cookies, {
        role: AUTH_ROLES.ADMIN,
        username: ADMIN_USERNAME,
      });
      return okResponse;
    }

    const supabase = createAuthSupabaseClient();

    const expectedUsername = await fetchCustomUsernameFromSettings(supabase);
    if (username !== expectedUsername) {
      return NextResponse.json(
        { error: "Invalid Username or Password" },
        { status: 401 }
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: SYSTEM_AUTH_EMAIL,
      password,
    });

    if (error || !data.session || !data.user) {
      return NextResponse.json(
        { error: "Invalid Username or Password" },
        { status: 401 }
      );
    }

    const okResponse = NextResponse.json({
      ok: true,
      username,
      role: AUTH_ROLES.USER,
    });

    setAuthSessionCookies(okResponse.cookies, {
      role: AUTH_ROLES.USER,
      username,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    });

    return okResponse;
  } catch {
    return NextResponse.json({ error: "Invalid Username or Password" }, { status: 401 });
  }
}
