import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST() {
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
    const { error } = await supabase.auth.signOut();

    if (error) {
      return errorResponse("Failed to sign out", 500);
    }

    return successResponse(null, "Signed out successfully");
  } catch (error: any) {
    console.error("Logout error:", error);
    return errorResponse("An unexpected error occurred while signing out", 500);
  }
}
