import {
  apiPost,
  apiGet,
  setStoredToken,
  setStoredRefreshToken,
  clearAllTokens,
  getStoredToken,
  getStoredRefreshToken,
} from "@/lib/api"
import type { User } from "@/types"

interface LoginResponse {
  access_token: string
  refresh_token: string
  pending_setup?: boolean
}

/**
 * Realiza login — detecta se input é email (@) ou código numérico (usuario).
 * Armazena access_token e refresh_token + seta cookie de sessão para o middleware.
 */
export async function login(
  usuario: string,
  senha: string,
): Promise<{ access_token: string; refresh_token: string; pending_setup?: boolean }> {
  const isEmail = usuario.includes("@")

  const body = isEmail
    ? { email: usuario, senha }
    : { usuario: usuario, senha }

  const res = await apiPost<LoginResponse>("/auth/login", body)
  setStoredToken(res.access_token)
  setStoredRefreshToken(res.refresh_token)

  // Cookie não-sensível para o middleware Next.js detectar sessão ativa.
  // max-age=1296000 = 15 dias em segundos (igual à validade do refresh token).
  if (typeof document !== "undefined") {
    document.cookie = "satmaza_session=1; path=/; SameSite=Strict; max-age=1296000"
  }

  return res
}

/**
 * Realiza logout — revoga tokens no backend e limpa toda a sessão local.
 */
export async function logout(): Promise<void> {
  try {
    const refreshToken = getStoredRefreshToken()
    await apiPost("/auth/logout", refreshToken ? { refresh_token: refreshToken } : undefined)
  } finally {
    clearAllTokens()
  }
}

/**
 * Retorna os dados do usuário autenticado a partir do token armazenado.
 * Usado no mount para validar sessão e após login para popular o contexto.
 */
export async function getMe(): Promise<User> {
  const data = await apiGet<{
    id: number
    usuario: string
    nome: string | null
    email: string | null
    tipo: string
    createdAt: string
    password_changed: boolean
  }>("/auth/me")

  return {
    id: data.id,
    usuario: data.usuario,
    nome: data.nome,
    email: data.email,
    tipo: data.tipo as User["tipo"],
    createdAt: data.createdAt,
    password_changed: data.password_changed ?? false,
  }
}

/**
 * Verifica se há um token armazenado (sem validar com o backend).
 */
export function hasToken(): boolean {
  return !!getStoredToken()
}
