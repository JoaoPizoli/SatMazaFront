import { NextRequest, NextResponse } from "next/server"

/**
 * Middleware de proteção de rotas server-side.
 *
 * Verifica o cookie `satmaza_session` (setado pelo JS após login bem-sucedido)
 * antes de permitir acesso a rotas protegidas. Isso evita flashes de conteúdo
 * e adiciona uma camada extra além da verificação client-side no AuthContext.
 *
 * Nota: a validação real do JWT acontece no backend a cada requisição de API.
 * Este middleware é uma barreira de UX/segurança superficial — não substitui
 * a autenticação do backend.
 */
export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("satmaza_session")

  if (!sessionCookie?.value) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/complete-registration"],
}
