export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { errorResponse } from "@/lib/api-response";
import { getSafeFilePath } from "@/lib/storage/adapters/local-storage.adapter";

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  ico: "image/x-icon",
  pdf: "application/pdf",
  txt: "text/plain",
  json: "application/json",
};

export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get("key");

    if (!key) {
      return errorResponse("O parâmetro 'key' é obrigatório.", 400);
    }

    const uploadDir =
      process.env.LOCAL_STORAGE_DIR ||
      path.join(process.cwd(), "public", "uploads");

    const filePath = getSafeFilePath(uploadDir, key);

    if (!fs.existsSync(filePath)) {
      return errorResponse("Arquivo não encontrado no storage local.", 404);
    }

    const stat = await fs.promises.stat(filePath);
    if (!stat.isFile()) {
      return errorResponse("O recurso solicitado não é um arquivo.", 400);
    }

    const ext = path.extname(filePath).toLowerCase().replace(/^\./, "");
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    const fileBuffer = await fs.promises.readFile(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": stat.size.toString(),
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error: any) {
    console.error("[LocalFile API] Erro ao servir arquivo:", error);
    return errorResponse(
      error?.message || "Erro interno ao servir arquivo local.",
      500
    );
  }
}
