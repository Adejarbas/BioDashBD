import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createCookieHandlers } from "@/lib/supabase/server";
import {
  successResponse,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/api-response";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: createCookieHandlers(cookieStore),
      }
    );

    const { data, error: authError } = await supabase.auth.getUser();

    if (authError || !data?.user) {
      return unauthorizedResponse("Unauthorized");
    }

    const user = data.user;

    const { data: userProfile, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Database error:", error);
      return errorResponse("Failed to fetch user data", 500);
    }

    const userData =
      userProfile ||
      {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || "User",
        company_name: null,
        address: null,
        phone: null,
        profile_image_url: null,
      };

    return successResponse(userData, "User data retrieved successfully");
  } catch (error: any) {
    console.error("Auth error:", error);
    return errorResponse("Internal server error", 500);
  }
}
