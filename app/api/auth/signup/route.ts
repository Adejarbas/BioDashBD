import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  isValidEmail,
  validateRequiredFields,
  validatePassword,
} from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, full_name, company_name } = body;

    // Validação de campos obrigatórios
    const requiredValidation = validateRequiredFields(body, ["email", "password", "full_name"]);
    if (!requiredValidation.valid) {
      return validationErrorResponse(requiredValidation.errors);
    }

    // Validação de formato de email
    if (!isValidEmail(email)) {
      return validationErrorResponse({
        email: ["Invalid email format"],
      });
    }

    // Validação de força da senha
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return validationErrorResponse({
        password: passwordValidation.errors,
      });
    }

    // Validação de nome completo
    if (full_name.trim().length < 2) {
      return validationErrorResponse({
        full_name: ["Full name must be at least 2 characters long"],
      });
    }

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

    // Cria o usuário no Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: full_name.trim(),
          company_name: company_name?.trim() || null,
        },
      },
    });

    if (error) {
      // Mapear erros comuns do Supabase
      let errorMessage = error.message;
      if (error.message.includes("User already registered")) {
        errorMessage = "An account with this email already exists";
      }

      return errorResponse(errorMessage, 400);
    }

    if (!data.user) {
      return errorResponse("Failed to create user account", 500);
    }

    // Sucesso: usuário criado, mas precisa confirmar email
    return successResponse(
      {
        userId: data.user.id,
        email: data.user.email,
        emailConfirmed: data.user.email_confirmed_at !== null,
      },
      "Account created successfully! Please check your email to confirm your account."
    );
  } catch (error: any) {
    console.error("SIGNUP ERROR:", error);
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid request body", 400);
    }
    return errorResponse("An unexpected error occurred while creating account", 500);
  }
}
