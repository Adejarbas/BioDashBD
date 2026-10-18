export const runtime = "nodejs";

import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import {
  errorResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import {
  getSafeFilePath,
  verifyLocalToken,
} from "@/lib/storage/adapters/local-storage.adapter";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

async function handleUpload(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get("key");
    const token = request.nextUrl.searchParams.get("token");

    if (!key) {
      return errorResponse("O parâmetro 'key' é obrigatório.", 400);
    }

    if (!token || !verifyLocalToken(key, token)) {
      return unauthorizedResponse("Token de upload local inválido ou expirado.");
    }

    const uploadDir =
      process.env.LOCAL_STORAGE_DIR ||
      path.join(process.cwd(), "public", "uploads");

    const filePath = getSafeFilePath(uploadDir, key);

    const arrayBuffer = await request.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return errorResponse("Nenhum dado de arquivo enviado no corpo da requisição.", 400);
    }

    if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
      return errorResponse(
        `O arquivo excede o limite máximo permitido de ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
        413
      );
    }

    const buffer = Buffer.from(arrayBuffer);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, buffer);

    return successResponse(
      { key, size: buffer.byteLength },
      "Upload concluído com sucesso no armazenamento local.",
      200
    );
  } catch (error: any) {
    console.error("[LocalUpload API] Erro ao gravar arquivo:", error);
    return errorResponse(
      error?.message || "Erro interno ao processar upload local.",
      500
    );
  }
}

export async function PUT(request: NextRequest) {
  return handleUpload(request);
}

export async function POST(request: NextRequest) {
  return handleUpload(request);
}
