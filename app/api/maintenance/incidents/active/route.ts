export const runtime = "nodejs";

import { NextRequest } from "next/server";
import pool from "@/lib/postgres/client";
import { getTokenFromRequest } from "@/lib/auth/jwt";
import { errorResponse, successResponse, unauthorizedResponse } from "@/lib/api-response";
import logger from "@/lib/logger-winston";

export async function PUT(request: NextRequest) {
  const user = getTokenFromRequest(request);
  if (!user) return unauthorizedResponse("Sessão inválida ou expirada.");

  try {
    const body = await request.json();
    const resolutionMessage = body?.resolution_message || body?.resolutionMessage || "";

    const { rowCount } = await pool.query(
      `UPDATE maintenance_incidents 
       SET resolution_message = $1, status = 'resolved', updated_at = NOW()
       WHERE user_id = $2 AND (status = 'pending' OR status IS NULL OR resolution_message IS NULL)`,
      [resolutionMessage, user.id]
    );

    logger.info("Active maintenance incidents resolved", {
      userId: user.id,
      updatedCount: rowCount || 0,
    });

    return successResponse(
      { updated: rowCount },
      "Incidente resolvido com sucesso."
    );
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      return errorResponse("Corpo da requisição inválido.", 400);
    }
    logger.error("Maintenance incident resolve PUT error", {
      userId: user.id,
      error: error?.message || String(error),
    });
    return errorResponse("Erro ao resolver incidente.", 500);
  }
}
