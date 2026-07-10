import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Stopgap password gate for /admin until Supabase Auth is wired up (see
// architecture doc section 9, Security). Fixed username + a single shared
// password via env vars — enough to keep the admin panel off the open
// internet without building a full login system yet.
function isAdminPath(pathname: string): boolean {
  const withoutLocale = pathname.replace(/^\/(en|tr)(?=\/|$)/, "");
  return withoutLocale.startsWith("/admin");
}

function unauthorized(): NextResponse {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
  });
}

export default function middleware(request: NextRequest) {
  if (isAdminPath(request.nextUrl.pathname)) {
    const expectedPassword = process.env.ADMIN_PASSWORD;
    if (!expectedPassword) {
      // Fail closed rather than leaving the admin panel open if
      // misconfigured.
      return new NextResponse("Admin panel is not configured", { status: 503 });
    }

    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Basic ")) {
      const decoded = atob(authHeader.slice("Basic ".length));
      const separatorIndex = decoded.indexOf(":");
      const password = decoded.slice(separatorIndex + 1);
      const username = decoded.slice(0, separatorIndex);
      const expectedUsername = process.env.ADMIN_USERNAME ?? "admin";
      if (username === expectedUsername && password === expectedPassword) {
        return intlMiddleware(request);
      }
    }

    return unauthorized();
  }

  return intlMiddleware(request);
}

export const config = {
  // Skip Next internals, API routes, and static/image files
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
