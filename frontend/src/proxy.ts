import { type NextRequest, NextResponse } from "next/server";
import { BASIC_AUTH_REALM, isAuthorized } from "@/lib/auth/basic-auth";

/**
 * Runs before every request to the docs UI (/v1/admin/...).
 *
 * - DOCS_AUTH_USER + DOCS_AUTH_PASSWORD set  -> browser asks for them (HTTP Basic auth).
 * - Not set, development                      -> open, for convenience.
 * - Not set, production                       -> closed (503). The docs never go public by accident.
 *
 * Proxy runs on the Node.js runtime in Next.js 16, so env vars are read per request (runtime config).
 */
const MIN_PASSWORD_LENGTH = 12;

export function proxy(request: NextRequest) {
  const user = process.env.DOCS_AUTH_USER;
  const password = process.env.DOCS_AUTH_PASSWORD;

  if (!user || !password || password.length < MIN_PASSWORD_LENGTH) {
    if (process.env.NODE_ENV === "production") {
      return new NextResponse(
        `Docs UI is disabled: set DOCS_AUTH_USER and a DOCS_AUTH_PASSWORD of at least ${MIN_PASSWORD_LENGTH} characters.`,
        {
          status: 503,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store",
          },
        },
      );
    }
    return NextResponse.next();
  }

  if (isAuthorized(request.headers.get("authorization"), user, password)) {
    return NextResponse.next();
  }
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": BASIC_AUTH_REALM,
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export const config = {
  matcher: ["/v1/admin/:path*"],
};
