import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  IFileStoragePort,
  UploadUrlResult,
  DownloadUrlResult,
} from "../ports/storage.port";

export function getSafeFilePath(baseDir: string, key: string): string {
  const cleanKey = key.replace(/\\/g, "/");
  const sanitized = path.normalize(cleanKey).replace(/^(\.\.[\/\\])+/, "");
  const fullPath = path.resolve(baseDir, sanitized);
  const resolvedBase = path.resolve(baseDir);

  if (!fullPath.startsWith(resolvedBase)) {
    throw new Error("Acesso negado: caminho fora do diretório de armazenamento.");
  }
  return fullPath;
}

export function generateLocalToken(key: string, expiresInSeconds: number): string {
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  const data = `${key}:${expiresAt}`;
  const secret = process.env.JWT_SECRET || "biodash_local_storage_secret";
  const signature = crypto.createHmac("sha256", secret).update(data).digest("hex");
  return `${expiresAt}.${signature}`;
}

export function verifyLocalToken(key: string, token: string): boolean {
  if (!token) return false;
  try {
    const [expiresAtStr, signature] = token.split(".");
    if (!expiresAtStr || !signature) return false;
    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return false;
    }
    const secret = process.env.JWT_SECRET || "biodash_local_storage_secret";
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${key}:${expiresAt}`)
      .digest("hex");
    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}

export class LocalStorageAdapter implements IFileStoragePort {
  readonly providerName = "local";
  private uploadDir: string;
  private defaultBaseUrl: string;

  constructor() {
    this.uploadDir =
      process.env.LOCAL_STORAGE_DIR ||
      path.join(process.cwd(), "public", "uploads");
    this.defaultBaseUrl = process.env.API_BASE_URL || "http://localhost:3003";

    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  getUploadDir(): string {
    return this.uploadDir;
  }

  async generateUploadUrl(
    fileName: string,
    contentType: string,
    userId: string,
    baseUrl?: string
  ): Promise<UploadUrlResult> {
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = sanitizedFileName.startsWith(`${userId}/`)
      ? sanitizedFileName
      : `${userId}/${sanitizedFileName}`;

    const expiresInSeconds = 900; // 15 minutos
    const token = generateLocalToken(key, expiresInSeconds);
    const host = baseUrl || this.defaultBaseUrl;

    const uploadUrl = `${host}/api/storage/local-upload?key=${encodeURIComponent(
      key
    )}&token=${encodeURIComponent(token)}`;
    const publicUrl = `${host}/api/storage/local-file?key=${encodeURIComponent(
      key
    )}`;

    return {
      uploadUrl,
      key,
      publicUrl,
      expiresInSeconds,
    };
  }

  async generateDownloadUrl(
    key: string,
    expiresInSeconds = 3600,
    baseUrl?: string
  ): Promise<DownloadUrlResult> {
    const cleanKey = key.replace(/\\/g, "/").replace(/^\/+/, "");
    const host = baseUrl || this.defaultBaseUrl;
    const downloadUrl = `${host}/api/storage/local-file?key=${encodeURIComponent(
      cleanKey
    )}`;

    return {
      downloadUrl,
      key: cleanKey,
      expiresInSeconds,
    };
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const filePath = getSafeFilePath(this.uploadDir, key);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
      return true;
    } catch (error) {
      console.error("[LocalStorageAdapter] Erro ao deletar arquivo:", error);
      return false;
    }
  }
}
