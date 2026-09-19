export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { getTokenFromRequest } from "@/lib/auth/jwt";
import { getUserMarkers } from "@/lib/chatbot-data";
import { AiServiceError, requestAi } from "@/lib/ai-service";
import { errorResponse, successResponse, unauthorizedResponse } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  const user = getTokenFromRequest(request);
  if (!user) return unauthorizedResponse("Sessão inválida ou expirada.");

  try {
    const body = await request.json();
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    if (!query) return errorResponse("A busca é obrigatória.", 400);

    const markers = await getUserMarkers(user.id);
    const result = await requestAi<any>("/semantic-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, markers }),
    });
    return successResponse(result);
  } catch (error: any) {
    if (error instanceof AiServiceError) return errorResponse(error.message, error.status);
    console.error("Semantic search route error:", error);
    return errorResponse("Não foi possível realizar a busca.", 500);
  }
}
