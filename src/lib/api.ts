/**
 * Cliente HTTP centralizado para comunicação com o backend SatMaza.
 * Injeta automaticamente o token JWT e trata erros globais (401, 429, etc).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
const TOKEN_KEY = "satmaza_token"

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredToken() {
  sessionStorage.removeItem(TOKEN_KEY)
}

// ─── Error class ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

// ─── Core fetch wrapper ──────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getStoredToken()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  // Token expirado ou inválido → limpar sessão e redirecionar
  if (res.status === 401) {
    clearStoredToken()
    sessionStorage.removeItem("satmaza_user")
    if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
      window.location.href = "/login"
    }
    throw new ApiError(401, "Sessão expirada. Faça login novamente.")
  }

  if (res.status === 429) {
    throw new ApiError(429, "Muitas requisições. Aguarde um momento.")
  }

  if (res.status === 403) {
    throw new ApiError(403, "Acesso negado. Você não tem permissão para esta ação.")
  }

  // Resposta sem corpo (204 No Content, ou DELETE bem-sucedido)
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T
  }

  const body = await res.text()
  
  if (!res.ok) {
    let message = "Erro inesperado"
    try {
      const json = JSON.parse(body)
      message = json.message || json.error || message
      if (Array.isArray(message)) message = message.join(", ")
    } catch {
      message = body || message
    }
    throw new ApiError(res.status, message)
  }

  try {
    return JSON.parse(body) as T
  } catch {
    return body as unknown as T
  }
}

// ─── Métodos HTTP tipados ────────────────────────────────────────────────────

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" })
}

export function apiPost<T>(path: string, data?: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  })
}

export function apiPatch<T>(path: string, data?: unknown): Promise<T> {
  return request<T>(path, {
    method: "PATCH",
    body: data ? JSON.stringify(data) : undefined,
  })
}

export function apiDelete(path: string): Promise<void> {
  return request<void>(path, { method: "DELETE" })
}
