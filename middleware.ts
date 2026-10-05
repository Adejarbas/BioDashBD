import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

// Remove barra final se existir na origem
function normalizeOrigin(origin: string) {
  return origin.endsWith("/") ? origin.slice(0, -1) : origin;
}

// Origens permitidas: dashboard frontend + mobile frontend
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  "http://localhost",              // Front web no Docker porta 80
  "http://localhost:80",
  "http://localhost:3000",
  "http://localhost:3001",         // Dev local frontend
  "http://localhost:8081",         // Expo Web
  "http://localhost:19006",        // Expo Web (porta legada)
  "http://127.0.0.1",
  "http://127.0.0.1:80",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:19006",
  "http://localhost:3003",         // Dev local backend
].filter(Boolean).map(url => normalizeOrigin(url as string));

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  const normalized = normalizeOrigin(origin);
  if (ALLOWED_ORIGINS.includes(normalized)) return true;

  // Permite qualquer localhost ou 127.0.0.1 em qualquer porta
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized)) return true;

  // Permite rede local (192.168.x.x, 10.x.x.x, 172.16-31.x.x) para testes no celular ou máquinas na mesma rede
  if (/^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(normalized)) return true;

  return false;
}

export async function middleware(req: NextRequest) {
  const origin = req.headers.get("origin");

  // CORS Preflight para /api
  if (req.method === "OPTIONS" && req.nextUrl.pathname.startsWith("/api")) {
    const resPre = new NextResponse(null, { status: 204 });
    if (origin && isAllowedOrigin(origin)) {
      resPre.headers.set("Access-Control-Allow-Origin", normalizeOrigin(origin));
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
    if (origin && isAllowedOrigin(origin)) {
      res.headers.set("Access-Control-Allow-Origin", normalizeOrigin(origin));
      res.headers.set("Access-Control-Allow-Credentials", "true");
      res.headers.set("Vary", "Origin");
    }
  }

  // Proteção /dashboard — verifica JWT no cookie
  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/biodash_token=([^;]+)/);
    const token = match ? match[1] : null;

    let authenticated = false;
    if (token) {
      try {
        verifyToken(token);
        authenticated = true;
      } catch {
        authenticated = false;
      }
    }

    if (!authenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("next", req.nextUrl.pathname + (req.nextUrl.search || ""));
      return NextResponse.redirect(loginUrl);
    }
  }

  return res;
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
