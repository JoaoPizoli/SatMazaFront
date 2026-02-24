"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useAuth } from "@/contexts/auth-context"
import { Phone, Eye, EyeOff, Loader2, User, Lock, AlertCircle } from "lucide-react"
import Image from "next/image"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

type LoginFormData = {
  usuario: string
  senha: string
}

export function LoginForm() {
  const { login } = useAuth()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>()

  // Mensagem de erro vinda de redirecionamentos externos (ex: complete-registration)
  const externalError = searchParams.get("error") === "nome_erp"
    ? "Não foi possível identificar seu perfil no sistema. Aguarde 1 minuto e tente novamente. Caso o problema persista, entre em contato com o suporte: (19) 99745-9819."
    : null

  async function onSubmit(data: LoginFormData) {
    setError("")
    setIsSubmitting(true)
    const result = await login(data.usuario, data.senha)

    if (result.success) {
      if (result.pending_setup) {
        window.location.href = "/complete-registration"
        return
      }
    } else {
      setError(result.error ?? "Erro ao fazer login")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-muted/50 px-4 py-12">
      {/* Barra de destaque da marca */}
      <div className="absolute inset-x-0 top-0 h-1 bg-primary" />

      <div className="w-full max-w-[420px]">
        {/* ==================== BRANDING ==================== */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="relative h-36 w-72">
            <Image
              src="/logo-maza.svg"
              alt="SatMaza"
              fill
              className="object-contain"
              priority
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Sistema de Assistência Técnica
          </p>
        </div>

        {/* ==================== CARD DE LOGIN ==================== */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acesse sua conta</CardTitle>
            <CardDescription>
              Insira suas credenciais para continuar
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Erro externo (ex: ERP indisponível no primeiro acesso) */}
            {externalError && (
              <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{externalError}</span>
              </div>
            )}

            <form
              id="login-form"
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4"
            >
              {/* Erro de credenciais */}
              {error && (
                <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Campo Usuário */}
              <div className="space-y-2">
                <Label htmlFor="usuario">Usuário</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="usuario"
                    type="text"
                    placeholder="Código numérico ou e-mail"
                    autoComplete="username"
                    className="h-10 pl-10"
                    aria-invalid={!!errors.usuario}
                    {...register("usuario", {
                      required: "O campo código é obrigatório",
                    })}
                  />
                </div>
                {errors.usuario && (
                  <p className="text-xs text-destructive">
                    {errors.usuario.message}
                  </p>
                )}
              </div>

              {/* Campo Senha */}
              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    className="h-10 pl-10 pr-10"
                    aria-invalid={!!errors.senha}
                    {...register("senha", {
                      required: "O campo senha é obrigatório",
                      minLength: {
                        value: 6,
                        message: "A senha deve ter no mínimo 6 caracteres",
                      },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={
                      showPassword ? "Ocultar senha" : "Mostrar senha"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.senha && (
                  <p className="text-xs text-destructive">
                    {errors.senha.message}
                  </p>
                )}
              </div>

              {/* Botão de Login */}
              <Button
                type="submit"
                className="h-10 w-full font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex-col gap-0">
            <Separator className="mb-4" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <span>Suporte: (19) 99745-9819</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
