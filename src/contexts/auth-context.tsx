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
import { UserRole, type User } from "@/types"
import { login as apiLogin, logout as apiLogout, getMe } from "@/lib/api/auth"
import { getStoredToken, clearAllTokens, tryRestoreSession } from "@/lib/api"

type AuthContextType = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (usuario: string, senha: string) => Promise<{ success: boolean; error?: string; pending_setup?: boolean }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const USER_STORAGE_KEY = "satmaza_user"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Restaurar sessão ao montar o provider (inclusive após fechar e reabrir o browser)
  useEffect(() => {
    async function restoreSession() {
      try {
        let token = getStoredToken() // sessionStorage — apagado ao fechar o browser

        if (!token) {
          // Sem access token: tentar renovar via refresh token (localStorage — persiste 15 dias)
          const restored = await tryRestoreSession()
          if (!restored) {
            // Nenhuma sessão recuperável
            setIsLoading(false)
            return
          }
          token = getStoredToken() // agora tem o novo access token
        }

        // Pré-popular com cache para reduzir flash (sobrescrito pela validação abaixo)
        const cached = sessionStorage.getItem(USER_STORAGE_KEY)
        if (cached) {
          try {
            setUser(JSON.parse(cached) as User)
          } catch {
            // ignorar erro de parse — validação abaixo irá corrigir
          }
        }

        // Validar sessão com o backend e buscar dados atualizados do usuário
        const userData = await getMe()
        setUser(userData)
        sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData))
      } catch {
        // Token inválido/expirado e refresh falhou — limpar tudo
        clearAllTokens()
        setUser(null)
      } finally {
        // Só libera a renderização após validação completa
        setIsLoading(false)
      }
    }

    restoreSession()
  }, [])

  // Redirecionamentos automáticos (só executam após isLoading = false)
  useEffect(() => {
    if (isLoading) return

    const isLoginPage = pathname === "/login"
    const isCompleteRegistrationPage = pathname === "/complete-registration"
    const isAuthenticated = !!user
    const needsSetup =
      isAuthenticated &&
      user!.tipo === UserRole.REPRESENTANTE &&
      !user!.password_changed

    if (!isAuthenticated && !isLoginPage && !isCompleteRegistrationPage) {
      router.replace("/login")
    } else if (needsSetup && !isCompleteRegistrationPage) {
      // Representante com cadastro incompleto: redireciona independente de onde estiver
      router.replace("/complete-registration")
    } else if (isAuthenticated && !needsSetup && isLoginPage) {
      router.replace("/dashboard")
    }
  }, [user, isLoading, pathname, router])

  const login = useCallback(
    async (
      usuario: string,
      senha: string,
    ): Promise<{ success: boolean; error?: string; pending_setup?: boolean }> => {
      try {
        const res = await apiLogin(usuario, senha)

        if (res.pending_setup) {
          return { success: true, pending_setup: true }
        }

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
    [],
  )

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } catch {
      // Mesmo se o backend falhar, garantir limpeza local
      clearAllTokens()
    }
    setUser(null)
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
