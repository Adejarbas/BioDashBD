import { NextRequest } from "next/server";
import pool from "@/lib/postgres/client";
import { getTokenFromCookieHeader } from "@/lib/auth/jwt";
import { successResponse, errorResponse } from "@/lib/api-response";
import logger from "@/lib/logger-winston";

export async function GET(request: NextRequest) {
  try {
    const payload = getTokenFromCookieHeader(request.headers.get("cookie"));

    // Busca o registro mais recente do usuário (ou de qualquer usuário para leitura global)
    const userId = payload?.id;

    let result;
    if (userId) {
      result = await pool.query(
        `SELECT
           SUM(energy_generated) AS energy_generated,
           SUM(waste_processed)  AS waste_processed,
           SUM(tax_savings)      AS tax_savings
         FROM biodigester_indicators
         WHERE user_id = $1`,
        [userId]
      );
    } else {
      result = await pool.query(
        `SELECT
           SUM(energy_generated) AS energy_generated,
           SUM(waste_processed)  AS waste_processed,
           SUM(tax_savings)      AS tax_savings
         FROM biodigester_indicators`
      );
    }

    const row = result.rows[0] || {};
    const dashboardData = {
      energyGenerated: Number(row.energy_generated) || 0,
      wasteProcessed: Number(row.waste_processed) || 0,
      taxSavings: Number(row.tax_savings) || 0,
    };

    logger.info("Dashboard indicators retrieved", {
      userId: userId || "anonymous",
      energyGenerated: dashboardData.energyGenerated,
      wasteProcessed: dashboardData.wasteProcessed,
      taxSavings: dashboardData.taxSavings,
    });

    return successResponse(dashboardData, "Dashboard indicators retrieved successfully");
  } catch (error: any) {
    logger.error("Error fetching dashboard indicators", {
      error: error?.message || String(error),
    });
    return errorResponse("Failed to fetch indicators", 500);
  }
}
