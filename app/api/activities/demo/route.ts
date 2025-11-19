import { type NextRequest, NextResponse } from "next/server"
import {
  successResponse,
  errorResponse,
} from "@/lib/api-response"

// Demo endpoint to manually trigger activities for testing
export async function POST(request: NextRequest) {
  try {
    const demoActivities = [
      { type: "success", description: "Biodigestor atingiu temperatura ideal de operação" },
      { type: "info", description: "Processamento de 500kg de resíduos orgânicos iniciado" },
      { type: "warning", description: "Nível de metano acima do esperado - verificar ventilação" },
      { type: "success", description: "Geração de energia elétrica aumentou 8% na última hora" },
      { type: "info", description: "Sistema de monitoramento atualizado para versão 2.1" },
      { type: "warning", description: "Sensor de umidade reportando valores inconsistentes" },
      { type: "success", description: "Manutenção preventiva concluída com sucesso" },
      { type: "error", description: "Falha temporária na comunicação com sensor de pressão" },
      { type: "info", description: "Backup automático dos dados realizado" },
      { type: "success", description: "Eficiência do sistema otimizada - economia de 12%" },
    ]

    const randomActivity = demoActivities[Math.floor(Math.random() * demoActivities.length)]

    // Send to main activities endpoint
    const response = await fetch(`${request.nextUrl.origin}/api/activities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(randomActivity),
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        return successResponse(result.data, "Demo activity created successfully")
      } else {
        return errorResponse("Failed to create demo activity", 500)
      }
    } else {
      const errorData = await response.json().catch(() => ({}))
      return errorResponse(
        errorData.error || "Failed to create demo activity",
        response.status
      )
    }
  } catch (error: any) {
    console.error("Error creating demo activity:", error)
    return errorResponse("Failed to create demo activity", 500)
  }
}


