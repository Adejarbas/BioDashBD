import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createCookieHandlers } from "@/lib/supabase/server";
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  isValidEmail,
  validateRequiredFields,
} from "@/lib/api-response";
const logger = require("@/lib/logger-winston");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    logger.info("Login attempt", { email });

    // Validação de campos obrigatórios
    const requiredValidation = validateRequiredFields(body, ["email", "password"]);
    if (!requiredValidation.valid) {
      logger.warn("Login validation failed", { email, errors: requiredValidation.errors });
      return validationErrorResponse(requiredValidation.errors);
    }

    // Validação de formato de email
    if (!isValidEmail(email)) {
      logger.warn("Invalid email format", { email });
      return validationErrorResponse({
        email: ["Invalid email format"],
      });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: createCookieHandlers(cookieStore),
      }
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      // Mapear erros comuns do Supabase para mensagens mais amigáveis
      let errorMessage = error.message;
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Please confirm your email before signing in";
      }

      logger.warn("Login failed", { email, error: errorMessage });
      return errorResponse(errorMessage, 401);
    }

    if (!data.user) {
      logger.error("Authentication failed - no user returned", { email });
      return errorResponse("Failed to authenticate user", 500);
    }

    logger.info("Login successful", { userId: data.user.id, email: data.user.email });

    // Retornar dados mínimos para o front com redirectTo
    return successResponse(
      {
        userId: data.user.id,
        email: data.user.email,
        redirectTo: "/dashboard",
      },
      "Login successful"
    );
  } catch (error: any) {
    logger.error("Login error", { error: error.message, stack: error.stack });
    console.error("Login error:", error);
    if (error instanceof SyntaxError) {
      return errorResponse("Invalid request body", 400);
    }
    return errorResponse("An unexpected error occurred", 500);
  }
}
