export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { getTokenFromRequest } from "@/lib/auth/jwt";
import { getStorageService } from "@/lib/storage/storage.factory";
import {
  errorResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import logger from "@/lib/logger-winston";

export async function POST(request: NextRequest) {
  const user = getTokenFromRequest(request);
  if (!user) {
    logger.warn("Tentativa não autorizada de gerar upload URL");
    return unauthorizedResponse("Sessão inválida ou expirada.");
  }

  try {
    const body = await request.json();
    const { fileName, contentType } = body || {};

    if (!fileName || typeof fileName !== "string") {
      logger.warn("Validação falhou ao gerar upload URL: fileName ausente", { userId: user.id });
      return errorResponse("O campo 'fileName' é obrigatório.", 400);
    }

    const storage = getStorageService();
    const origin = request.nextUrl.origin;
    const result = await storage.generateUploadUrl(
      fileName,
      contentType || "application/octet-stream",
      user.id,
      origin
    );

    logger.info("Upload URL emitida para cliente", {
      userId: user.id,
      fileName,
      key: result.key,
      storageProvider: storage.providerName,
    });

    return successResponse(result, "URL de upload gerada com sucesso.");
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      return errorResponse("Corpo da requisição JSON inválido.", 400);
    }
    logger.error("Erro ao gerar upload URL", {
      userId: user.id,
      error: error?.message || String(error),
    });
    return errorResponse(
      error?.message || "Erro interno ao gerar URL de upload.",
      500
    );
  }
}
