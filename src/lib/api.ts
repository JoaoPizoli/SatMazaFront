/**
 * Cliente HTTP centralizado para comunicação com o backend SatMaza.
 * Injeta automaticamente o token JWT, trata erros globais e implementa
 * renovação automática de tokens (refresh token rotation).
 */

// Lança erro em produção se a variável não estiver configurada
const API_URL = (() => {
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXT_PUBLIC_API_URL não está configurada. Defina no ambiente de build.")
    }
    return "http://localhost:3040"
  }
  return url
})()

const TOKEN_KEY = "satmaza_token"
const REFRESH_TOKEN_KEY = "satmaza_refresh_token"
const REQUEST_TIMEOUT_MS = 15_000

// ─── Token helpers ────────────────────────────────────────────────────────────

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

// Refresh token usa localStorage para persistir ao fechar o browser (sessão de 15 dias)
export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setStoredRefreshToken(token: string) {
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

/** Limpa todos os dados de sessão: tokens, cache de usuário e cookie do middleware */
export function clearAllTokens() {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem("satmaza_user")
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  document.cookie = "satmaza_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict"
}

/**
 * Tenta restaurar a sessão usando o refresh token persistido no localStorage.
 * Usado pelo AuthProvider ao inicializar quando não há access token na sessionStorage
 * (ex: após fechar e reabrir o browser).
 * Retorna true se a sessão foi restaurada com sucesso.
 */
export async function tryRestoreSession(): Promise<boolean> {
  return tryRefreshToken()
}

// ─── Refresh token (renovação automática) ─────────────────────────────────────

let isRefreshing = false
let refreshQueue: Array<(success: boolean) => void> = []

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getStoredRefreshToken()
  if (!refreshToken) return false

  // Enfileirar chamadas que chegam durante o refresh em andamento
  if (isRefreshing) {
    return new Promise<boolean>((resolve) => {
      refreshQueue.push(resolve)
    })
  }

  isRefreshing = true
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!res.ok) {
      clearAllTokens()
      refreshQueue.forEach((cb) => cb(false))
      refreshQueue = []
      return false
    }

    const data = await res.json()
    setStoredToken(data.access_token)
    setStoredRefreshToken(data.refresh_token)
    refreshQueue.forEach((cb) => cb(true))
    refreshQueue = []
    return true
  } catch {
    clearAllTokens()
    refreshQueue.forEach((cb) => cb(false))
    refreshQueue = []
    return false
  } finally {
    isRefreshing = false
  }
}

// ─── Error class ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

// ─── Sanitização de erros ─────────────────────────────────────────────────────

const GENERIC_ERRORS: Record<number, string> = {
  404: "Recurso não encontrado.",
  500: "Erro interno do servidor. Tente novamente mais tarde.",
  502: "Servidor indisponível. Tente novamente em instantes.",
  503: "Serviço temporariamente indisponível.",
}

function sanitizeErrorMessage(status: number, rawMessage: string): string {
  // Mensagens 400 (validação) são geradas pelo backend e são seguras para exibir
  if (status === 400 && rawMessage && rawMessage.length < 300) {
    return rawMessage
  }
  return GENERIC_ERRORS[status] ?? "Erro inesperado. Tente novamente."
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const token = getStoredToken()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    })
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError(0, "A requisição expirou. Verifique sua conexão.")
    }
    throw new ApiError(0, "Erro de conexão. Verifique sua internet.")
  } finally {
    clearTimeout(timeoutId)
  }

  // Token expirado → tentar refresh automático (uma vez)
  if (res.status === 401) {
    if (path === "/auth/login" || path === "/auth/refresh") {
      throw new ApiError(401, "Usuário/e-mail e/ou senha digitados incorretamente.")
    }

    if (!isRetry) {
      const refreshed = await tryRefreshToken()
      if (refreshed) {
        return request<T>(path, options, true)
      }
    }

    clearAllTokens()
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

  // Resposta sem corpo (204 No Content ou DELETE bem-sucedido)
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T
  }

  const body = await res.text()

  if (!res.ok) {
    let rawMessage = "Erro inesperado"
    try {
      const json = JSON.parse(body)
      rawMessage = json.message || json.error || rawMessage
      if (Array.isArray(rawMessage)) rawMessage = rawMessage.join(", ")
    } catch {
      rawMessage = body || rawMessage
    }
    throw new ApiError(res.status, sanitizeErrorMessage(res.status, rawMessage))
  }

  try {
    return JSON.parse(body) as T
  } catch {
    return body as unknown as T
  }
}

// ─── Métodos HTTP tipados ─────────────────────────────────────────────────────

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
