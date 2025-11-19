export const runtime = 'nodejs';
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import {
  successResponse,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/api-response"

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, { ...options, path: "/" });
              });
            } catch (error) {
              // Cookies são automaticamente persistidos no App Router
            }
          },
        },
      }
    )

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return unauthorizedResponse("Unauthorized")
    }

    const { data: biodigesterData, error } = await supabase
      .from("biodigester_data")
      .select("*")
      .eq("user_id", user.id)
      .order("timestamp", { ascending: false })
      .limit(30)

    if (error) {
      console.error("Database error:", error)
      return errorResponse("Failed to fetch biodigester data", 500)
    }

    // Process data for charts
    const processedData = {
      wasteProcessed:
        biodigesterData
          ?.slice(0, 7)
          .reverse()
          .map((item, index) => ({
            month: new Date(item.timestamp).toLocaleDateString("pt-BR", { month: "short" }),
            value: item.waste_processed || 0,
          })) || [],
      energyGenerated:
        biodigesterData
          ?.slice(0, 7)
          .reverse()
          .map((item, index) => ({
            month: new Date(item.timestamp).toLocaleDateString("pt-BR", { month: "short" }),
            value: item.energy_generated || 0,
          })) || [],
      stats: {
        wasteProcessed: {
          value: biodigesterData?.[0]?.waste_processed?.toString() || "0",
          unit: "kg",
          change: "+12.5%",
          increasing: true,
        },
        energyGenerated: {
          value: biodigesterData?.[0]?.energy_generated?.toString() || "0",
          unit: "kWh",
          change: "+8.2%",
          increasing: true,
        },
        efficiency: {
          value: biodigesterData?.[0]?.efficiency_rate?.toString() || "0",
          unit: "%",
          change: "+1.2%",
          increasing: true,
        },
      },
    }

    return successResponse(processedData, "Biodigester data retrieved successfully")
  } catch (error: any) {
    console.error("Biodigester data error:", error)
    return errorResponse("Internal server error", 500)
  }
}


