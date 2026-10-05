export const runtime = "nodejs";

import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/lib/postgres/client";
import { getTokenFromRequest } from "@/lib/auth/jwt";
import { errorResponse, successResponse, unauthorizedResponse } from "@/lib/api-response";
const logger = require("@/lib/logger-winston");

const SALT_ROUNDS = 10;

export async function PUT(req: NextRequest) {
  const user = getTokenFromRequest(req);
  if (!user) {
    return unauthorizedResponse("Sessão inválida ou expirada.");
  }

  try {
    const body = await req.json();
    const newPassword = body?.newPassword || body?.password;

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return errorResponse("A nova senha deve ter pelo menos 6 caracteres.", 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await pool.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [passwordHash, user.id]
    );

    logger.info("Password updated successfully", { userId: user.id });

    return successResponse(null, "Senha alterada com sucesso.");
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      return errorResponse("Corpo da requisição inválido.", 400);
    }
    logger.error("PUT /api/auth/password error", { error: error.message });
    console.error("PUT /api/auth/password error:", error);
    return errorResponse("Erro ao alterar senha.", 500);
  }
}
