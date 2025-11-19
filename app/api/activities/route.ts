import { type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { isSupabaseConfigured } from "@/lib/supabase/server"
import {
  successResponse,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/api-response"

// --- FUNÇÃO DE FORMATAÇÃO DE DATA (Sem alterações) ---

function formatTimestamp(timestamp: string): string {
  const now = new Date()
  const activityTime = new Date(timestamp)
  const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return "Agora mesmo"
  if (diffInMinutes < 60) return `${diffInMinutes} minuto${diffInMinutes > 1 ? "s" : ""} atrás`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hora${diffInHours > 1 ? "s" : ""} atrás`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays === 1) return "Ontem"
  if (diffInDays < 7) return `${diffInDays} dias atrás`

  return activityTime.toLocaleDateString("pt-BR")
}

// --- FUNÇÃO AUXILIAR REATORADA PARA AUTH ---

/**
 * Cria um cliente Supabase server-side e obtém o usuário autenticado.
 * Encapsula a lógica de cookies e autenticação para reuso.
 */
async function getSupabaseClientAndUser() {
  
  const cookieStore = await cookies() 
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // A função set() funciona em API Routes para definir cookies na resposta
              cookieStore.set(name, value, { ...options, path: "/" })
            })
          } catch (error) {
            // Log de erro pode ser útil aqui se houver problemas
            // console.error("Falha ao definir cookie:", error)
          }
        },
      },
    }
  )

  // Obtém o usuário
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  return { supabase, user, authError }
}

// --- HANDLER GET (Refatorado) ---

export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured) {
      return successResponse({ activities: [], total: 0 }, "Activities retrieved successfully")
    }

    // Bloco de autenticação refatorado
    const { supabase, user, authError } = await getSupabaseClientAndUser()
    if (authError || !user) {
      return unauthorizedResponse("Unauthorized")
    }

    const url = new URL(request.url)
    const limitParam = url.searchParams.get("limit")
    const limit = limitParam ? Number.parseInt(limitParam) : 10
    const since = url.searchParams.get("since")

    if (limitParam && (isNaN(limit) || limit < 1 || limit > 100)) {
      return errorResponse("Limit must be a number between 1 and 100", 400)
    }

    let query = supabase
      .from("activities")
      .select("*")
      .eq("user_id", user.id)
      .order("timestamp", { ascending: false })
      .limit(limit)

    if (since) {
      const sinceDate = new Date(since)
      if (isNaN(sinceDate.getTime())) {
        return errorResponse("Invalid 'since' date format. Use ISO 8601 format", 400)
      }
      query = query.gt("timestamp", since)
    }

    const { data: activities, error } = await query

    if (error) {
      console.error("Database error:", error)
      // Retorna sucesso com lista vazia em caso de erro de DB, como no original
      return successResponse({ activities: [], total: 0 }, "Activities retrieved successfully")
    }

    const formattedActivities = (activities || []).map((activity) => ({
      ...activity,
      timestamp: formatTimestamp(activity.timestamp),
    }))

    return successResponse(
      {
        activities: formattedActivities,
        total: formattedActivities.length,
      },
      "Activities retrieved successfully"
    )
  } catch (error: any) {
    console.error("Error fetching activities:", error)
    return errorResponse("Failed to fetch activities", 500)
  }
}

// --- HANDLER POST (Refatorado) ---

export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured) {
      return errorResponse("Supabase not configured", 501)
    }

    // Bloco de autenticação refatorado
    const { supabase, user, authError } = await getSupabaseClientAndUser()
    if (authError || !user) {
      return unauthorizedResponse("Unauthorized")
    }

    const body = await request.json()
    const { type, description } = body

    if (!type || !description) {
      return errorResponse("Type and description are required", 400)
    }
    if (typeof type !== "string" || type.trim().length === 0) {
      return errorResponse("Type must be a non-empty string", 400)
    }
    if (typeof description !== "string" || description.trim().length === 0) {
      return errorResponse("Description must be a non-empty string", 400)
    }
    if (description.trim().length > 500) {
      return errorResponse("Description must be less than 500 characters", 400)
    }

    const { data: newActivity, error } = await supabase
      .from("activities")
      .insert({
        user_id: user.id,
        type: type.trim(),
        description: description.trim(),
      })
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return errorResponse("Failed to add activity", 500)
    }

    return successResponse(
      {
        ...newActivity,
        timestamp: formatTimestamp(newActivity.timestamp),
      },
      "Activity added successfully"
    )
  } catch (error: any) {
    console.error("Error adding activity:", error)
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid request body", 400)
    }
    return errorResponse("Failed to add activity", 500)
  }
}