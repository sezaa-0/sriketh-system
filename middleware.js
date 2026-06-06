import { NextResponse } from "next/server";
import { isAuthenticatedFromCookies } from "@/lib/auth/session";

const PUBLIC_PATHS = new Set(["/login"]);

const STATIC_FILE =
  /\.(svg|png|jpg|jpeg|gif|webp|ico|json|txt|xml|woff2?|ttf|eot)$/i;

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth/") ||
    STATIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const authenticated = isAuthenticatedFromCookies(request.cookies);

  if (PUBLIC_PATHS.has(pathname)) {
    if (authenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!authenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
