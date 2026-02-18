import { apiPost, apiGet, setStoredToken, clearStoredToken, getStoredToken } from "@/lib/api"
import type { User } from "@/types"

interface LoginResponse {
  access_token: string
}

/**
 * Realiza login — detecta se input é email (@) ou código numérico (usuario).
 */
export async function login(
  usuario: string,
  senha: string,
): Promise<{ access_token: string }> {
  const isEmail = usuario.includes("@")

  const body = isEmail
    ? { email: usuario, senha }
    : { usuario: usuario, senha }

  const res = await apiPost<LoginResponse>("/auth/login", body)
  setStoredToken(res.access_token)
  return res
}

/**
 * Realiza logout — invalida o token no backend.
 */
export async function logout(): Promise<void> {
  try {
    await apiPost("/auth/logout")
  } finally {
    clearStoredToken()
    sessionStorage.removeItem("satmaza_user")
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
    email: string | null
    tipo: string
    createdAt: string
  }>("/auth/me")

  return {
    id: data.id,
    usuario: data.usuario,
    email: data.email,
    tipo: data.tipo as User["tipo"],
    createdAt: data.createdAt,
  }
}

/**
 * Verifica se há um token armazenado (sem validar).
 */
export function hasToken(): boolean {
  return !!getStoredToken()
}
