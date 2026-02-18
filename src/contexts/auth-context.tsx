"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import { useRouter, usePathname } from "next/navigation"
import type { User } from "@/types"
import { login as apiLogin, logout as apiLogout, getMe } from "@/lib/api/auth"
import { getStoredToken, clearStoredToken } from "@/lib/api"

type AuthContextType = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (usuario: string, senha: string) => Promise<{ success: boolean; error?: string; pending_setup?: boolean }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const USER_STORAGE_KEY = "satmaza_user"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Restaurar sessão: valida token chamando GET /auth/me
  useEffect(() => {
    async function restoreSession() {
      try {
        const token = getStoredToken()
        if (!token) {
          setIsLoading(false)
          return
        }

        // Tentar restaurar do cache local primeiro (para evitar flash)
        const cached = sessionStorage.getItem(USER_STORAGE_KEY)
        if (cached) {
          try {
            setUser(JSON.parse(cached) as User)
          } catch {
            // ignore parse error
          }
        }

        // Validar com o backend
        const userData = await getMe()
        setUser(userData)
        sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData))
      } catch {
        // Token inválido ou expirado
        clearStoredToken()
        sessionStorage.removeItem(USER_STORAGE_KEY)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    restoreSession()
  }, [])

  // Redirecionamentos automáticos
  useEffect(() => {
    if (isLoading) return

    const isLoginPage = pathname === "/login"
    const isCompleteRegistrationPage = pathname === "/complete-registration"
    const isAuthenticated = !!user

    if (!isAuthenticated && !isLoginPage && !isCompleteRegistrationPage) {
      router.replace("/login")
    } else if (isAuthenticated && isLoginPage) {
      router.replace("/dashboard")
    }
  }, [user, isLoading, pathname, router])

  const login = useCallback(
    async (
      usuario: string,
      senha: string
    ): Promise<{ success: boolean; error?: string; pending_setup?: boolean }> => {
      try {
        // Chama POST /auth/login — armazena token internamente
        const res = await apiLogin(usuario, senha)

        // Se tiver flag pending_setup, retornamos isso para o componente tratar o redirect
        if (res.pending_setup) {
          return { success: true, pending_setup: true }
        }

        // Buscar dados completos do usuário
        const userData = await getMe()
        setUser(userData)
        sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData))

        return { success: true }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao realizar login"
        return { success: false, error: message }
      }
    },
    []
  )

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } catch {
      // Mesmo se falhar, limpar sessão local
    }
    setUser(null)
    sessionStorage.removeItem(USER_STORAGE_KEY)
    router.replace("/login")
  }, [router])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>")
  }
  return ctx
}
