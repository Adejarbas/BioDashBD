export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { getTokenFromRequest } from "@/lib/auth/jwt";
import { AiServiceError, requestAi } from "@/lib/ai-service";
import { errorResponse, successResponse, unauthorizedResponse } from "@/lib/api-response";

const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const user = getTokenFromRequest(request);
  if (!user) return unauthorizedResponse("Sessão inválida ou expirada.");

  try {
    const incoming = await request.formData();
    const audio = incoming.get("audio");
    if (!(audio instanceof File)) return errorResponse("Envie o áudio no campo 'audio'.", 400);
    if (!audio.size) return errorResponse("O arquivo de áudio está vazio.", 400);
    if (audio.size > MAX_AUDIO_BYTES) return errorResponse("O áudio excede o limite de 20 MB.", 413);

    const outgoing = new FormData();
    outgoing.append("audio", audio, audio.name || "voice-message.webm");
    const transcription = await requestAi<{ text: string; language?: string; duration?: number }>(
      "/transcribe",
      { method: "POST", body: outgoing },
      120_000
    );
    return successResponse(transcription);
  } catch (error: any) {
    if (error instanceof AiServiceError) return errorResponse(error.message, error.status);
    console.error("Audio transcription route error:", error);
    return errorResponse("Não foi possível transcrever o áudio.", 500);
  }
}
