export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { getTokenFromRequest } from "@/lib/auth/jwt";
import { AiServiceError, requestAi } from "@/lib/ai-service";
import { errorResponse, successResponse, unauthorizedResponse } from "@/lib/api-response";
import logger from "@/lib/logger-winston";

const MAX_AUDIO_BYTES = Number(process.env.MAX_AUDIO_BYTES || 500 * 1024);
const MAX_AUDIO_DURATION_SECONDS = Number(process.env.MAX_AUDIO_DURATION_SECONDS || 12);
const AUDIO_DURATION_TOLERANCE_SECONDS = 1.5;
const TRANSCRIBE_TIMEOUT_MS = Number(process.env.TRANSCRIBE_TIMEOUT_MS || 20_000);

const AUDIO_SIZE_LIMIT_ERROR = "O áudio excede o limite de 500 KB (máximo de 12 segundos).";
const AUDIO_DURATION_LIMIT_ERROR = "O áudio excede o tempo máximo de 12 segundos.";

function exceedsMaxDuration(duration: number): boolean {
  return (
    Number.isFinite(duration) &&
    duration > MAX_AUDIO_DURATION_SECONDS + AUDIO_DURATION_TOLERANCE_SECONDS
  );
}

export async function POST(request: NextRequest) {
  const user = getTokenFromRequest(request);
  if (!user) return unauthorizedResponse("Sessão inválida ou expirada.");

  try {
    const contentLengthHeader = request.headers.get("content-length");
    const contentLength = contentLengthHeader ? Number(contentLengthHeader) : 0;
    if (Number.isFinite(contentLength) && contentLength > MAX_AUDIO_BYTES + 32 * 1024) {
      return errorResponse(AUDIO_SIZE_LIMIT_ERROR, 413);
    }

    const incoming = await request.formData();
    const audio = incoming.get("audio");
    if (!(audio instanceof File)) return errorResponse("Envie o áudio no campo 'audio'.", 400);
    if (!audio.size) return errorResponse("O arquivo de áudio está vazio.", 400);
    if (audio.size > MAX_AUDIO_BYTES) return errorResponse(AUDIO_SIZE_LIMIT_ERROR, 413);

    const rawDuration = incoming.get("durationSeconds");
    if (typeof rawDuration === "string" && rawDuration.trim() !== "") {
      const durationSeconds = Number(rawDuration);
      if (exceedsMaxDuration(durationSeconds)) {
        return errorResponse(AUDIO_DURATION_LIMIT_ERROR, 413);
      }
    }

    logger.info("Iniciando transcrição de áudio via Whisper", {
      userId: user.id,
      fileName: audio.name || "voice-message.webm",
      audioSizeBytes: audio.size,
    });

    const outgoing = new FormData();
    outgoing.append("audio", audio, audio.name || "voice-message.webm");
    const transcription = await requestAi<{ text: string; language?: string; duration?: number }>(
      "/transcribe",
      { method: "POST", body: outgoing },
      TRANSCRIBE_TIMEOUT_MS
    );

    if (typeof transcription?.duration === "number" && exceedsMaxDuration(transcription.duration)) {
      logger.warn("Áudio transcrito excedeu o tempo máximo permitido", {
        userId: user.id,
        audioDurationSec: transcription.duration,
        maxDurationSec: MAX_AUDIO_DURATION_SECONDS,
      });
      return errorResponse(AUDIO_DURATION_LIMIT_ERROR, 413);
    }

    logger.info("Transcrição de áudio concluída com sucesso", {
      userId: user.id,
      audioDurationSec: transcription?.duration,
      language: transcription?.language,
      textLength: transcription?.text?.length || 0,
    });

    const normalizedText = transcription?.text?.trim() || "";
    if (!normalizedText) {
      logger.warn("Transcrição concluída sem fala reconhecida", {
        userId: user.id,
        audioDurationSec: transcription?.duration,
      });
      return successResponse({
        ...transcription,
        text: "",
        status: "no-recognized" as const,
      });
    }

    return successResponse({
      ...transcription,
      text: normalizedText,
      status: "success" as const,
    });
  } catch (error: any) {
    if (error instanceof AiServiceError) {
      if (error.status === 422) {
        logger.warn("Nenhuma fala reconhecida pelo serviço de IA", {
          userId: user.id,
        });
        return successResponse({
          text: "",
          status: "no-recognized" as const,
        });
      }
      return errorResponse(error.message, error.status);
    }
    logger.error("Erro na rota de transcrição de áudio", {
      userId: user.id,
      error: error?.message || String(error),
    });
    return errorResponse("Não foi possível transcrever o áudio.", 500);
  }
}
