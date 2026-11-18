export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { getTokenFromRequest } from "@/lib/auth/jwt";
import { getUserIndicators, getUserMarkers } from "@/lib/chatbot-data";
import { AiServiceError, requestAi } from "@/lib/ai-service";
import { errorResponse, successResponse, unauthorizedResponse } from "@/lib/api-response";
import logger from "@/lib/logger-winston";

export async function POST(request: NextRequest) {
  const user = getTokenFromRequest(request);
  if (!user) return unauthorizedResponse("Sessão inválida ou expirada.");

  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) return errorResponse("A mensagem é obrigatória.", 400);
    if (message.length > 500) return errorResponse("A mensagem deve ter no máximo 500 caracteres.", 400);

    const history = Array.isArray(body?.history) ? body.history : [];
    const context = body?.context && typeof body.context === "object" ? body.context : undefined;

    const [markers, indicators] = await Promise.all([
      getUserMarkers(user.id),
      getUserIndicators(user.id),
    ]);
    const answer = await requestAi<any>("/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history, context, markers, indicators }),
    });

    logger.info("Chatbot message processed", {
      userId: user.id,
      intent: answer?.intent,
      confidence: answer?.confidence,
      questionType: answer?.question_type,
      action: answer?.action || null,
      markersCount: markers.length,
    });

    return successResponse(answer);
  } catch (error: any) {
    if (error instanceof SyntaxError) return errorResponse("Corpo da requisição inválido.", 400);
    if (error instanceof AiServiceError) return errorResponse(error.message, error.status);
    logger.error("Chatbot route error", {
      userId: user.id,
      error: error?.message || String(error),
    });
    return errorResponse("Não foi possível processar a mensagem.", 500);
  }
}
