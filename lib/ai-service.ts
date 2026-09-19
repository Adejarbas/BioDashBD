const AI_SERVICE_URL = (process.env.AI_SERVICE_URL || "http://127.0.0.1:5000").replace(/\/$/, "");

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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${AI_SERVICE_URL}${path}`, {
      ...options,
      cache: "no-store",
      signal: controller.signal,
    });
    const text = await response.text();
    let body: any = {};
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      throw new AiServiceError("O serviço de IA retornou uma resposta inválida.");
    }

    if (!response.ok) {
      throw new AiServiceError(
        body.detail || body.error || "O serviço de IA não conseguiu processar a solicitação.",
        response.status >= 500 ? 503 : response.status
      );
    }
    return body as T;
  } catch (error: any) {
    if (error instanceof AiServiceError) throw error;
    if (error?.name === "AbortError") {
      throw new AiServiceError("O serviço de IA excedeu o tempo de resposta.", 504);
    }
    throw new AiServiceError("O serviço de IA está indisponível.", 503);
  } finally {
    clearTimeout(timeout);
  }
}
