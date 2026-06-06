import { NextResponse } from "next/server";
import { getServerCookieStore } from "@/lib/auth/cookies-server";
import { readAuthSession } from "@/lib/auth/session";

export async function GET() {
  const cookieStore = getServerCookieStore();
  const session = readAuthSession(cookieStore);

  if (!session.authenticated) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    username: session.username,
    role: session.role,
  });
}
