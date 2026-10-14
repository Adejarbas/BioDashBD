export const runtime = "nodejs";

import { NextRequest } from "next/server";
import pool from "@/lib/postgres/client";
import { getTokenFromRequest } from "@/lib/auth/jwt";
import { errorResponse, successResponse, unauthorizedResponse } from "@/lib/api-response";
import { classifySensorReading } from "@/lib/anomaly-classifier";

export async function GET(request: NextRequest) {
  const user = getTokenFromRequest(request);
  if (!user) return unauthorizedResponse("Sessão inválida ou expirada.");

  try {
    const { searchParams } = new URL(request.url);
    const biodigesterId = searchParams.get("biodigesterId") || searchParams.get("biodigester_id");
    const sensorType = searchParams.get("sensorType") || searchParams.get("sensor_type");
    const level = searchParams.get("level") || searchParams.get("alertLevel") || searchParams.get("alert_level");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
    const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10))) : 50;
    const offset = (page - 1) * limit;

    const conditions: string[] = ["sa.user_id = $1"];
    const params: any[] = [user.id];

    if (biodigesterId && biodigesterId !== "all" && biodigesterId !== "todos") {
      if (!isNaN(Number(biodigesterId))) {
        params.push(Number(biodigesterId));
        conditions.push(`(sa.biodigester_id = $${params.length} OR LOWER(COALESCE(sa.biodigester_name, '')) LIKE LOWER('%' || $${params.length} || '%'))`);
      } else {
        params.push(`%${biodigesterId.toLowerCase()}%`);
        conditions.push(`(LOWER(COALESCE(sa.biodigester_name, bm.address->>'title', '')) LIKE $${params.length})`);
      }
    }

    if (sensorType && sensorType !== "all" && sensorType !== "todos") {
      params.push(`%${sensorType.toLowerCase()}%`);
      conditions.push(`LOWER(sa.sensor_type) LIKE $${params.length}`);
    }

    if (level && level !== "all" && level !== "todos") {
      // Suporte a alias de criticidade
      const normLevel = level.toLowerCase();
      if (normLevel === "critico") {
        conditions.push(`(LOWER(sa.alert_level) = 'critical' OR LOWER(sa.alert_level) = 'critico')`);
      } else if (normLevel === "aviso" || normLevel === "alerta") {
        conditions.push(`(LOWER(sa.alert_level) = 'low' OR LOWER(sa.alert_level) = 'medium' OR LOWER(sa.alert_level) = 'aviso')`);
      } else {
        params.push(normLevel);
        conditions.push(`LOWER(sa.alert_level) = $${params.length}`);
      }
    }

    if (status && status !== "all") {
      params.push(status.toLowerCase());
      conditions.push(`LOWER(sa.status) = $${params.length}`);
    }

    if (startDate) {
      const sDate = new Date(startDate);
      if (!isNaN(sDate.getTime())) {
        params.push(sDate.toISOString());
        conditions.push(`sa.created_at >= $${params.length}`);
      }
    }

    if (endDate) {
      const eDate = new Date(endDate);
      if (!isNaN(eDate.getTime())) {
        params.push(eDate.toISOString());
        conditions.push(`sa.created_at <= $${params.length}`);
      }
    }

    const whereClause = conditions.join(" AND ");

    // Conta o total de registros que satisfazem os filtros
    const countQuery = `
      SELECT COUNT(*) AS total 
      FROM sensor_alerts sa 
      LEFT JOIN biodigestor_maps bm ON sa.biodigester_id = bm.id 
      WHERE ${whereClause}
    `;
    const countRes = await pool.query(countQuery, params);
    const total = parseInt(countRes.rows[0]?.total || "0", 10);

    // Consulta com dados estruturados e join com biodigestor_maps
    const dataQuery = `
      SELECT 
        sa.id,
        sa.user_id,
        sa.biodigester_id,
        COALESCE(sa.biodigester_name, bm.address->>'title', 'Biodigestor Principal') AS biodigester_name,
        sa.sensor_id,
        COALESCE(sa.sensor_type, 'temperatura') AS sensor_type,
        sa.reading_value,
        sa.threshold_value,
        sa.unit,
        sa.alert_level,
        sa.message,
        COALESCE(sa.status, 'active') AS status,
        sa.resolved_at,
        sa.resolution_notes,
        sa.maintenance_id,
        sa.is_read,
        sa.created_at
      FROM sensor_alerts sa
      LEFT JOIN biodigestor_maps bm ON sa.biodigester_id = bm.id
      WHERE ${whereClause}
      ORDER BY sa.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const { rows } = await pool.query(dataQuery, [...params, limit, offset]);

    return successResponse({
      alerts: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Alerts GET error:", error);
    return errorResponse("Erro ao buscar histórico de alertas.", 500);
  }
}

export async function POST(request: NextRequest) {
  const user = getTokenFromRequest(request);
  if (!user) return unauthorizedResponse("Sessão inválida ou expirada.");

  try {
    const body = await request.json();

    const biodigesterId = body?.biodigesterId || body?.biodigester_id || null;
    let biodigesterName = body?.biodigesterName || body?.biodigester_name || null;
    const sensorId = body?.sensorId || body?.sensor_id || null;
    const sensorType = body?.sensorType || body?.sensor_type || "temperatura";
    const readingValue = body?.readingValue ?? body?.reading_value ?? null;
    let thresholdValue = body?.thresholdValue ?? body?.threshold_value ?? null;
    let unit = body?.unit || "";
    let alertLevel = body?.alertLevel || body?.alert_level || null;
    let message = typeof body?.message === "string" ? body.message.trim() : "";
    const status = body?.status || "active";
    const maintenanceId = body?.maintenanceId || body?.maintenance_id || null;

    // Se temos sensor_type e reading_value, podemos aplicar classificação automática
    if (readingValue !== null && !isNaN(Number(readingValue))) {
      const classification = classifySensorReading(sensorType, Number(readingValue));
      if (!alertLevel) {
        alertLevel = classification.alertLevel;
      }
      if (!thresholdValue) {
        thresholdValue = classification.threshold;
      }
      if (!unit) {
        unit = classification.unit;
      }
      if (!message) {
        message = classification.description;
      }
    }

    // Nível fallback
    if (!alertLevel) {
      alertLevel = "info";
    }

    if (!message) {
      message = `Alerta registrado para o sensor ${sensorType || 'desconhecido'}.`;
    }

    // Se tiver biodigesterId mas não tiver nome, tenta buscar de biodigestor_maps
    if (biodigesterId && !biodigesterName) {
      try {
        const bdRes = await pool.query(
          "SELECT address FROM biodigestor_maps WHERE id = $1 AND user_id = $2",
          [biodigesterId, user.id]
        );
        if (bdRes.rows.length > 0) {
          biodigesterName = bdRes.rows[0].address?.title || "Biodigestor";
        }
      } catch (err) {
        // silencioso
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO sensor_alerts (
        user_id, 
        biodigester_id, 
        biodigester_name, 
        sensor_id, 
        sensor_type, 
        reading_value, 
        threshold_value, 
        unit, 
        alert_level, 
        message, 
        status, 
        maintenance_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        user.id,
        biodigesterId ? Number(biodigesterId) : null,
        biodigesterName,
        sensorId,
        sensorType,
        readingValue !== null ? Number(readingValue) : null,
        thresholdValue !== null ? Number(thresholdValue) : null,
        unit,
        alertLevel,
        message,
        status,
        maintenanceId,
      ]
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
