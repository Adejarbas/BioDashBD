import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createCookieHandlers } from "@/lib/supabase/server";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

// GET: retorna usuário autenticado
export async function GET(req: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return errorResponse("Supabase env vars missing", 500);
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: createCookieHandlers(cookieStore) }
    );

    const { data, error } = await supabase.auth.getUser();

    if (error) {
      // Erro na verificação da sessão
      return unauthorizedResponse("Unauthorized");
    }

    if (!data.user) {
      return unauthorizedResponse("Unauthorized");
    }

    // Retorna apenas dados necessários (evita enviar tudo)
    return successResponse({
      userId: data.user.id,
      email: data.user.email,
      // Adicione outros campos se tiver armazenado no profile (ex: nome)
    });
  } catch (e) {
    console.error("GET /api/user error:", e);
    return errorResponse("Failed to fetch user", 500);
  }
}

// (Opcional) Se alguém tentar POST aqui por engano:
export async function POST() {
  return errorResponse("Use /api/auth/login para login", 405);
}