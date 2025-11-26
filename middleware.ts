import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Remove barra final se existir na origem
function normalizeOrigin(origin: string) {
  return origin.endsWith("/") ? origin.slice(0, -1) : origin;
}

// Permitir múltiplas origens (dev e produção)
const ALLOWED_ORIGINS = [
  normalizeOrigin(process.env.FRONTEND_URL || "http://localhost:3001"),
  normalizeOrigin(process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3001"),
].filter((origin, index, self) => self.indexOf(origin) === index); // Remove duplicatas

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  const normalized = normalizeOrigin(origin);
  return ALLOWED_ORIGINS.some(allowed => allowed === normalized);
}

export async function middleware(req: NextRequest) {
  // Preflight CORS para /api

  // CORS Preflight para /api
  if (req.method === "OPTIONS" && req.nextUrl.pathname.startsWith("/api")) {
    const origin = req.headers.get("origin");
    const resPre = new NextResponse(null, { status: 204 });
    
    if (origin && isAllowedOrigin(origin)) {
      const normalizedOrigin = normalizeOrigin(origin);
      resPre.headers.set("Access-Control-Allow-Origin", normalizedOrigin);
      resPre.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
      resPre.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie");
      resPre.headers.set("Access-Control-Allow-Credentials", "true");
      resPre.headers.set("Vary", "Origin");
    }
    
    return resPre;
  }

  const res = NextResponse.next();

  // CORS em rotas /api
  if (req.nextUrl.pathname.startsWith("/api")) {
    const origin = req.headers.get("origin");
    
    if (origin && isAllowedOrigin(origin)) {
      const normalizedOrigin = normalizeOrigin(origin);
      res.headers.set("Access-Control-Allow-Origin", normalizedOrigin);
      res.headers.set("Access-Control-Allow-Credentials", "true");
      res.headers.set("Vary", "Origin");
    }
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