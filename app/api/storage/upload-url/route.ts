export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { getTokenFromRequest } from "@/lib/auth/jwt";
import { getStorageService } from "@/lib/storage/storage.factory";
import {
  errorResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api-response";

export async function POST(request: NextRequest) {
  const user = getTokenFromRequest(request);
  if (!user) {
    return unauthorizedResponse("Sessão inválida ou expirada.");
  }

  try {
    const body = await request.json();
    const { fileName, contentType } = body || {};

    if (!fileName || typeof fileName !== "string") {
      return errorResponse("O campo 'fileName' é obrigatório.", 400);
    }

    const storage = getStorageService();
    const result = await storage.generateUploadUrl(
      fileName,
      contentType || "application/octet-stream",
      user.id
    );

    return successResponse(result, "URL de upload gerada com sucesso.");
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      return errorResponse("Corpo da requisição JSON inválido.", 400);
    }
    console.error("[Storage API] Erro ao gerar upload URL:", error);
    return errorResponse(
      error?.message || "Erro interno ao gerar URL de upload.",
      500
    );
  }
}
