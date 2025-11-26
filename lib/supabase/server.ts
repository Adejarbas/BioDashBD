import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

export const isSupabaseConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Configuração padrão de cookies para Supabase
 * Ajustado para funcionar em produção com domínios diferentes
 */
export function getCookieOptions(options?: CookieOptions): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  const isSecure = isProduction || process.env.NEXT_PUBLIC_API_BASE_URL?.startsWith('https');
  
  return {
    ...options,
    path: "/",
    sameSite: isProduction ? "none" as const : "lax" as const,
    secure: isSecure,
    httpOnly: options?.httpOnly ?? false,
  };
}

/**
 * Helper para configurar cookies do Supabase
 */
export function createCookieHandlers(cookieStore: ReadonlyRequestCookies) {
  return {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
      try {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, getCookieOptions(options));
        });
      } catch (error) {
        // Cookies são automaticamente persistidos no App Router
      }
    },
  };
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: createCookieHandlers(cookieStore),
    }
  );
}
