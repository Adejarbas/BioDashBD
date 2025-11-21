import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const FRONTEND_ORIGIN = process.env.FRONTEND_URL || "http://localhost:3000";

export async function middleware(req: NextRequest) {
  // Preflight CORS para /api
  if (req.method === "OPTIONS" && req.nextUrl.pathname.startsWith("/api")) {
    const resPre = new NextResponse(null, { status: 204 });
    resPre.headers.set("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
    resPre.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    resPre.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    resPre.headers.set("Access-Control-Allow-Credentials", "true");
    return resPre;
  }

  const res = NextResponse.next();

  // CORS em rotas /api
  if (req.nextUrl.pathname.startsWith("/api")) {
    res.headers.set("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
    res.headers.set("Access-Control-Allow-Credentials", "true");
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return res;
  }

  // Proteção /dashboard
  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    try {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll: () => req.cookies.getAll(),
            setAll: (cookiesToSet) => {
              cookiesToSet.forEach(({ name, value, options }) =>
                res.cookies.set(name, value, { ...(options || {}), path: "/" })
              );
            },
          },
        }
      );
      const { data } = await supabase.auth.getUser();
      if (!(data as any)?.user) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("next", req.nextUrl.pathname + (req.nextUrl.search || ""));
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      // fail-open
    }
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};