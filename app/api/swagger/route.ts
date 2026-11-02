import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import YAML from "yaml";
import logger from "@/lib/logger-winston";

// Garante que essa route roda em Node.js (e não Edge)
export const runtime = "nodejs";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "docs", "swagger.yaml");

    const file = await fs.readFile(filePath, "utf8");
    const swaggerDocument = YAML.parse(file);

    return NextResponse.json(swaggerDocument);
  } catch (error: any) {
    logger.error("Erro ao carregar swagger.yaml", { error: error?.message || String(error) });
    return NextResponse.json(
      {
        success: false,
        error: "Cannot load swagger.yaml",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
