export const runtime = "nodejs";

import { NextRequest } from "next/server";
import pool from "@/lib/postgres/client";
import { getTokenFromRequest } from "@/lib/auth/jwt";
import { errorResponse, successResponse, unauthorizedResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const user = getTokenFromRequest(request);
  if (!user) return unauthorizedResponse("Sessão inválida ou expirada.");

  try {
    const { rows } = await pool.query(
      `SELECT * FROM user_profiles WHERE user_id = $1`,
      [user.id]
    );

    return successResponse(rows[0] || null);
  } catch (error) {
    console.error("Profile GET error:", error);
    return errorResponse("Erro ao buscar perfil.", 500);
  }
}

export async function PUT(request: NextRequest) {
  const user = getTokenFromRequest(request);
  if (!user) return unauthorizedResponse("Sessão inválida ou expirada.");

  try {
    const body = await request.json();
    const {
      name,
      company,
      razaoSocial,
      razao_social,
      cnpj,
      address,
      numero,
      city,
      state,
      zipCode,
      zip_code,
      phone,
      email,
      avatarUrl,
      avatar_url,
    } = body || {};

    const companyName = razaoSocial || razao_social || company || null;
    const resolvedZip = zipCode || zip_code || null;
    const resolvedAvatar = avatarUrl || avatar_url || null;
    const parsedNumero = numero !== undefined && numero !== null && numero !== "" ? parseInt(String(numero), 10) : null;

    const { rows } = await pool.query(
      `INSERT INTO user_profiles (
         user_id, name, company, razao_social, cnpj, address, numero, city, state, zip_code, phone, email, avatar_url, updated_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW()
       )
       ON CONFLICT (user_id) DO UPDATE SET
         name = COALESCE($2, user_profiles.name),
         company = COALESCE($3, user_profiles.company),
         razao_social = COALESCE($4, user_profiles.razao_social),
         cnpj = COALESCE($5, user_profiles.cnpj),
         address = COALESCE($6, user_profiles.address),
         numero = COALESCE($7, user_profiles.numero),
         city = COALESCE($8, user_profiles.city),
         state = COALESCE($9, user_profiles.state),
         zip_code = COALESCE($10, user_profiles.zip_code),
         phone = COALESCE($11, user_profiles.phone),
         email = COALESCE($12, user_profiles.email),
         avatar_url = COALESCE($13, user_profiles.avatar_url),
         updated_at = NOW()
       RETURNING *`,
      [
        user.id,
        name || null,
        companyName,
        companyName,
        cnpj || null,
        address || null,
        Number.isNaN(parsedNumero) ? null : parsedNumero,
        city || null,
        state || null,
        resolvedZip,
        phone || null,
        email || null,
        resolvedAvatar,
      ]
    );

    return successResponse(rows[0], "Perfil atualizado com sucesso.");
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      return errorResponse("Corpo da requisição inválido.", 400);
    }
    console.error("Profile PUT error:", error);
    return errorResponse("Erro ao atualizar perfil.", 500);
  }
}
