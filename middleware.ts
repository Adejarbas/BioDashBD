import { NextResponse, type NextRequest } from 'next/server'

// Este middleware apenas passa a requisição adiante.
// Vamos colocar o 'runtime' na própria rota de API.
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

// Isso garante que o middleware só rode nas rotas de API
export const config = {
  matcher: '/api/:path*',
}