import logger from "@/lib/logger-winston";

function getAiServiceUrl(): string {
  return (process.env.AI_SERVICE_URL || "http://127.0.0.1:5000").replace(/\/$/, "");
}

export class AiServiceError extends Error {
  constructor(message: string, public status: number = 502) {
    super(message);
  }
}

export async function requestAi<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs: number = 30_000
): Promise<T> {
  const baseUrl = getAiServiceUrl();
  const targetUrl = `${baseUrl}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startTime = Date.now();

  try {
    const response = await fetch(targetUrl, {
      ...options,
      cache: "no-store",
      signal: controller.signal,
    });
    const durationMs = Date.now() - startTime;
    const text = await response.text();
    let body: any = {};
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      logger.error("AI Service retornou payload não-JSON inválido", {
        path,
        status: response.status,
        durationMs,
      });
      throw new AiServiceError("O serviço de IA retornou uma resposta inválida.");
    }

    if (!response.ok) {
      logger.warn("AI Service respondeu com erro HTTP", {
        path,
        status: response.status,
        durationMs,
        detail: body.detail || body.error,
      });
      throw new AiServiceError(
        body.detail || body.error || "O serviço de IA não conseguiu processar a solicitação.",
        response.status >= 500 ? 503 : response.status
      );
    }

    logger.info("AI Service request completed", {
      path,
      status: response.status,
      durationMs,
      coldStartCandidate: durationMs > 2500,
    });
    return body as T;
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    if (error instanceof AiServiceError) throw error;
    logger.error("Falha de conexão com o AI Service", {
      path,
      targetUrl,
      durationMs,
      error: error?.message || String(error),
    });
    if (error?.name === "AbortError") {
      throw new AiServiceError("O serviço de IA excedeu o tempo de resposta.", 504);
    }
    throw new AiServiceError("O serviço de IA está indisponível.", 503);
  } finally {
    clearTimeout(timeout);
  }
}
