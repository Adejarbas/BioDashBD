export const runtime = "nodejs";

import { NextRequest } from "next/server";
import pool from "@/lib/postgres/client";
import { getTokenFromRequest } from "@/lib/auth/jwt";
import { getUserMarkers, normalizeMarker } from "@/lib/chatbot-data";
import { errorResponse, successResponse, unauthorizedResponse } from "@/lib/api-response";
import logger from "@/lib/logger-winston";

function markerAddress(body: any) {
  const nested = body?.address && typeof body.address === "object" ? body.address : {};
  return {
    ...nested,
    title: String(body?.title || nested.title || "Biodigestor").trim(),
    latitude: Number(body?.latitude ?? nested.latitude),
    longitude: Number(body?.longitude ?? nested.longitude),
    description: String(body?.description ?? nested.description ?? "").trim(),
  };
}

export async function GET(request: NextRequest) {
  const user = getTokenFromRequest(request);
  if (!user) return unauthorizedResponse("Sessão inválida ou expirada.");
  try {
    const markers = await getUserMarkers(user.id);
    logger.info("Biodigester markers retrieved", {
      userId: user.id,
      count: markers.length,
    });
    return successResponse(markers);
  } catch (error: any) {
    logger.error("Markers GET error", {
      userId: user.id,
      error: error?.message || String(error),
    });
    return errorResponse("Erro ao buscar biodigestores.", 500);
  }
}

export async function POST(request: NextRequest) {
  const user = getTokenFromRequest(request);
  if (!user) return unauthorizedResponse("Sessão inválida ou expirada.");
  try {
    const body = await request.json();
    const address = markerAddress(body);
    if (!address.title) return errorResponse("O nome do biodigestor é obrigatório.", 400);
    if (!Number.isFinite(address.latitude) || !Number.isFinite(address.longitude)) {
      return errorResponse("Latitude e longitude válidas são obrigatórias.", 400);
    }

    let result;
    const id = body?.id || body?._id;
    if (id) {
      result = await pool.query(
        `UPDATE biodigestor_maps SET address = $1
         WHERE id = $2 AND user_id = $3 RETURNING id, user_id, address, created_at`,
        [address, id, user.id]
      );
      if (!result.rowCount) return errorResponse("Biodigestor não encontrado.", 404);
    } else {
      result = await pool.query(
        `INSERT INTO biodigestor_maps (user_id, address)
         VALUES ($1, $2) RETURNING id, user_id, address, created_at`,
        [user.id, address]
      );
    }

    const saved = normalizeMarker(result.rows[0]);
    logger.info(id ? "Biodigester marker updated" : "Biodigester marker created", {
      userId: user.id,
      markerId: saved.id,
      title: address.title,
      latitude: address.latitude,
      longitude: address.longitude,
    });

    return successResponse(saved, "Biodigestor salvo com sucesso.", id ? 200 : 201);
  } catch (error: any) {
    if (error instanceof SyntaxError) return errorResponse("Corpo da requisição inválido.", 400);
    logger.error("Markers POST error", {
      userId: user.id,
      error: error?.message || String(error),
    });
    return errorResponse("Erro ao salvar biodigestor.", 500);
  }
}
