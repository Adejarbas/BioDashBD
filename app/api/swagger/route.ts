import { NextResponse } from "next/server"
import path from "path"
import { promises as fs } from "fs"
import YAML from "yaml"

// 👇 Garante que essa route roda em Node.js (e não Edge)
export const runtime = "nodejs"

export async function GET() {
  try {
    // caminho: <raiz do projeto>/docs/swagger.yaml
    const filePath = path.join(process.cwd(), "docs", "swagger.yaml")

    const file = await fs.readFile(filePath, "utf8")
    const swaggerDocument = YAML.parse(file)

    return NextResponse.json(swaggerDocument)
  } catch (error) {
    console.error("Erro ao carregar swagger.yaml:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Cannot load swagger.yaml",
        details: String(error),
      },
      { status: 500 }
    )
  }
}
