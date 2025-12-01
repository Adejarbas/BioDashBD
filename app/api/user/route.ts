import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createCookieHandlers } from "@/lib/supabase/server";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
const logger = require("@/lib/logger-winston");

// GET: retorna usuário autenticado
export async function GET(req: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      logger.error("Supabase environment variables missing");
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
      logger.warn("Get user - unauthorized", { error: error.message });
      return unauthorizedResponse("Unauthorized");
    }

    if (!data.user) {
      logger.warn("Get user - no user data");
      return unauthorizedResponse("Unauthorized");
    }

    logger.info("User data fetched", { userId: data.user.id, email: data.user.email });

    // Retorna apenas dados necessários (evita enviar tudo)
    return successResponse({
      userId: data.user.id,
      email: data.user.email,
      // Adicione outros campos se tiver armazenado no profile (ex: nome)
    });
  } catch (e: any) {
    logger.error("GET /api/user error", { error: e.message, stack: e.stack });
    console.error("GET /api/user error:", e);
    return errorResponse("Failed to fetch user", 500);
  }
}

// (Opcional) Se alguém tentar POST aqui por engano:
export async function POST() {
  return errorResponse("Use /api/auth/login para login", 405);
}