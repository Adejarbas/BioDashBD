import { NextRequest, NextResponse } from "next/server";
import { getTokenFromRequest } from "@/lib/auth/jwt";
import { successResponse } from "@/lib/api-response";
import logger from "@/lib/logger-winston";

export async function POST(req: NextRequest) {
  const user = getTokenFromRequest(req);
  logger.info("User signed out", { userId: user?.id || null });

  const response = successResponse(null, "Signed out successfully") as NextResponse;

  // Remove o cookie JWT
  response.cookies.set("biodash_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0, // expira imediatamente
  });

  return response;
}
