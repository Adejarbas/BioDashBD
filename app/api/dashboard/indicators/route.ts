import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  successResponse,
  errorResponse,
} from "@/lib/api-response";

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
    );

    // Verificar autenticação (opcional, dependendo do requisito)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Se houver autenticação, filtrar por user_id se a tabela tiver esse campo
    let query = supabase
      .from("biodigester_indicators")
      .select("name, current_value, unit, status")
      .in("name", ["Energia Gerada", "Resíduos Processados", "Imposto Abatido"])
      .order("created_at", { ascending: true });

    const { data: indicators, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return errorResponse("Failed to fetch dashboard indicators", 500);
    }

    const dashboardData = {
      energyGenerated:
        indicators?.find((i) => i.name === "Energia Gerada")?.current_value || 0,
      wasteProcessed:
        indicators?.find((i) => i.name === "Resíduos Processados")?.current_value || 0,
      taxSavings:
        indicators?.find((i) => i.name === "Imposto Abatido")?.current_value || 0,
    };

    return successResponse(dashboardData, "Dashboard indicators retrieved successfully");
  } catch (error: any) {
    console.error("Error fetching dashboard indicators:", error);
    return errorResponse("Failed to fetch indicators", 500);
  }
}
