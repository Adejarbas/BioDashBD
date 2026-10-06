export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { getTokenFromRequest } from "@/lib/auth/jwt";
import { getStorageService } from "@/lib/storage/storage.factory";
import {
  errorResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const user = getTokenFromRequest(request);
  if (!user) {
    return unauthorizedResponse("Sessão inválida ou expirada.");
  }

  try {
    const key = request.nextUrl.searchParams.get("key");
    if (!key) {
      return errorResponse("O parâmetro 'key' é obrigatório.", 400);
    }

    const storage = getStorageService();
    const result = await storage.generateDownloadUrl(key);

    return successResponse(result, "URL de download gerada com sucesso.");
  } catch (error: any) {
    console.error("[Storage API] Erro ao gerar download URL:", error);
    return errorResponse(
      error?.message || "Erro interno ao gerar URL de download.",
      500
    );
  }
}
