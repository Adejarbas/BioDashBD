export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = createClient();

    // Obter usuário autenticado corretamente (SSR)
    const { data, error: authError } = await supabase.auth.getUser();

    if (authError || !data?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = data.user;

    // Buscar perfil do usuário na tabela "users"
    const { data: userProfile, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    // Se erro for diferente de "no rows returned"
    if (error && error.code !== "PGRST116") {
      console.error("Database error:", error);
      return NextResponse.json(
        { success: false, message: "Failed to fetch user data" },
        { status: 500 }
      );
    }

    // Caso não exista perfil, devolver objeto padrão
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

    return NextResponse.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createClient();

    // Obter usuário autenticado
    const { data, error: authError } = await supabase.auth.getUser();

    if (authError || !data?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = data.user;

    // Ler JSON enviado no body
    const body = await request.json();
    const { full_name, company_name, address, phone, profile_image_url } = body;

    // Atualizar/Inserir o perfil do usuário
    const { data: updated, error } = await supabase
      .from("users")
      .upsert(
        {
          id: user.id,
          email: user.email,
          full_name,
          company_name,
          address,
          phone,
          profile_image_url,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { success: false, message: "Failed to update user data" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: updated,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
