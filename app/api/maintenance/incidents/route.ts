export const runtime = "nodejs";

import { NextRequest } from "next/server";
import pool from "@/lib/postgres/client";
import { getTokenFromRequest } from "@/lib/auth/jwt";
import { errorResponse, successResponse, unauthorizedResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const user = getTokenFromRequest(request);
  if (!user) return unauthorizedResponse("Sessão inválida ou expirada.");

  try {
    const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { rows } = await pool.query(
      `SELECT * FROM maintenance_incidents
       WHERE user_id = $1 AND last_notification_at >= $2 AND (status != 'resolved' OR status IS NULL)
       ORDER BY created_at ASC LIMIT 1`,
      [user.id, since48h]
    );

    return successResponse(rows[0] || null);
  } catch (error) {
    console.error("Maintenance incidents GET error:", error);
    return errorResponse("Erro ao buscar incidentes.", 500);
  }
}

export async function POST(request: NextRequest) {
  const user = getTokenFromRequest(request);
  if (!user) return unauthorizedResponse("Sessão inválida ou expirada.");

  try {
    const body = await request.json();
    const description = typeof body?.description === "string" ? body.description.trim() : "";
    if (!description) {
      return errorResponse("A descrição do incidente é obrigatória.", 400);
    }

    const { rows } = await pool.query(
      `INSERT INTO maintenance_incidents (user_id, description, status, last_notification_at)
       VALUES ($1, $2, 'pending', NOW())
       RETURNING *`,
      [user.id, description]
    );

    return successResponse(rows[0], "Incidente criado com sucesso.", 201);
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      return errorResponse("Corpo da requisição inválido.", 400);
    }
    console.error("Maintenance incidents POST error:", error);
    return errorResponse("Erro ao criar incidente.", 500);
  }
}
