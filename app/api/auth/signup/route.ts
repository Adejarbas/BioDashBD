import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { email, password, full_name, company_name } = await req.json();
    const supabase = createClient();

    // Cria o usuário no Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, company_name }, // Campos extras no perfil
      },
    });

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    // Sucesso: usuário criado, mas precisa confirmar email
    return NextResponse.json(
      {
        success: true,
        message:
          "Conta criada com sucesso! Verifique seu e-mail para confirmar a conta.",
        user: data.user,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    return NextResponse.json(
      { success: false, message: "Erro inesperado ao criar conta." },
      { status: 500 }
    );
  }
}
