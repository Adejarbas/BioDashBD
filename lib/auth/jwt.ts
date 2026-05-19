/**
 * Helpers JWT para autenticação no BioDashBD
 * Compatível com os tokens gerados pelo backend Express (BioDash_mobile/backend)
 */
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'biodash_jwt_secret_2024_change_in_production';

export interface JwtPayload {
  id: string;
  email: string;
  iat?: number;
  exp?: number;
}

/** Gera um JWT com validade de 30 dias */
export function signToken(payload: { id: string; email: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

/** Verifica e decodifica um JWT. Lança erro se inválido. */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

/** Extrai o payload do JWT do cookie 'biodash_token'. Retorna null se inválido. */
export function getTokenFromCookieHeader(cookieHeader: string | null): JwtPayload | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/biodash_token=([^;]+)/);
  if (!match) return null;
  try {
    return verifyToken(match[1]);
  } catch {
    return null;
  }
}
