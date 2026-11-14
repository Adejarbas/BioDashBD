export const runtime = "nodejs";

import { NextRequest } from "next/server";
import pool from "@/lib/postgres/client";
import { getTokenFromRequest } from "@/lib/auth/jwt";
import { errorResponse, successResponse, unauthorizedResponse } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const user = getTokenFromRequest(request);
  if (!user) return unauthorizedResponse("Sessão inválida ou expirada.");

  const resolved = await Promise.resolve(params);
  const id = resolved?.id;
  if (!id) return errorResponse("ID do alerta não fornecido.", 400);

  try {
    const { rows } = await pool.query(
      `SELECT sa.*, 
        COALESCE(sa.biodigester_name, bm.address->>'title', 'Biodigestor') AS biodigester_name
       FROM sensor_alerts sa
       LEFT JOIN biodigestor_maps bm ON sa.biodigester_id = bm.id
       WHERE sa.id = $1 AND sa.user_id = $2`,
      [id, user.id]
    );

    if (rows.length === 0) {
      return errorResponse("Alerta não encontrado.", 404);
    }

    return successResponse(rows[0]);
  } catch (error) {
    console.error("Alert GET [id] error:", error);
    return errorResponse("Erro ao buscar detalhes do alerta.", 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = getTokenFromRequest(request);
  if (!user) return unauthorizedResponse("Sessão inválida ou expirada.");

  const resolved = await Promise.resolve(params);
  const id = resolved?.id;
  if (!id) return errorResponse("ID do alerta não fornecido.", 400);

  try {
    const body = await request.json();
    const status = body?.status;
    const resolutionNotes = body?.resolutionNotes || body?.resolution_notes;
    const maintenanceId = body?.maintenanceId || body?.maintenance_id;

    const updates: string[] = [];
    const values: any[] = [id, user.id];

    if (status) {
      values.push(status);
      updates.push(`status = $${values.length}`);
      if (status === "resolved") {
        updates.push("resolved_at = NOW()");
      }
    }

    if (resolutionNotes !== undefined) {
      values.push(resolutionNotes);
      updates.push(`resolution_notes = $${values.length}`);
    }

    if (maintenanceId !== undefined) {
      values.push(maintenanceId);
      updates.push(`maintenance_id = $${values.length}`);
    }

    if (updates.length === 0) {
      return errorResponse("Nenhum campo para atualizar informado.", 400);
    }

    const query = `
      UPDATE sensor_alerts
      SET ${updates.join(", ")}
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const { rows } = await pool.query(query, values);
    if (rows.length === 0) {
      return errorResponse("Alerta não encontrado.", 404);
    }

    return successResponse(rows[0], "Alerta atualizado com sucesso.");
  } catch (error: any) {
    console.error("Alert PATCH [id] error:", error);
    return errorResponse("Erro ao atualizar alerta.", 500);
  }
}

export const PUT = PATCH;

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const user = getTokenFromRequest(request);
  if (!user) return unauthorizedResponse("Sessão inválida ou expirada.");

  const resolved = await Promise.resolve(params);
  const id = resolved?.id;
  if (!id) return errorResponse("ID do alerta não fornecido.", 400);

  try {
    const result = await pool.query(
      `DELETE FROM sensor_alerts WHERE id = $1 AND user_id = $2`,
      [id, user.id]
    );

    if (result.rowCount === 0) {
      return errorResponse("Alerta não encontrado.", 404);
    }

    return successResponse({ deleted: true }, "Alerta removido do histórico.");
  } catch (error) {
    console.error("Alert DELETE [id] error:", error);
    return errorResponse("Erro ao remover alerta.", 500);
  }
}
