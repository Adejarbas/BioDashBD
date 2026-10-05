export const runtime = "nodejs";

import { NextRequest } from "next/server";
import pool from "@/lib/postgres/client";
import { getTokenFromRequest } from "@/lib/auth/jwt";
import { errorResponse, successResponse, unauthorizedResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const user = getTokenFromRequest(request);
  if (!user) return unauthorizedResponse("Sessão inválida ou expirada.");

  try {
    const { rows } = await pool.query(
      `SELECT * FROM sensor_alerts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [user.id]
    );
    return successResponse(rows);
  } catch (error) {
    console.error("Alerts GET error:", error);
    return errorResponse("Erro ao buscar alertas.", 500);
  }
}

export async function POST(request: NextRequest) {
  const user = getTokenFromRequest(request);
  if (!user) return unauthorizedResponse("Sessão inválida ou expirada.");

  try {
    const body = await request.json();
    const alertLevel = body?.alertLevel || body?.alert_level || "info";
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!message) {
      return errorResponse("A mensagem do alerta é obrigatória.", 400);
    }

    const { rows } = await pool.query(
      `INSERT INTO sensor_alerts (user_id, alert_level, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [user.id, alertLevel, message]
    );

    return successResponse(rows[0], "Alerta registrado com sucesso.", 201);
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      return errorResponse("Corpo da requisição inválido.", 400);
    }
    console.error("Alerts POST error:", error);
    return errorResponse("Erro ao criar alerta.", 500);
  }
}
