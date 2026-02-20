"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useAuth } from "@/contexts/auth-context"
import { Phone, Eye, EyeOff, Loader2, User, Lock, ShieldCheck } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type LoginFormData = {
  usuario: string
  senha: string
}

export function LoginForm() {
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>()

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
    <div className="flex min-h-svh w-full flex-col lg:flex-row">
      {/* ==================== BRAND HEADER — Mobile ==================== */}
      <div className="flex items-center justify-center gap-3 bg-primary px-6 py-5 lg:hidden">
        <div className="relative h-9 w-9">
          <Image src="/logo.svg" alt="SatMaza" fill className="object-contain" priority />
        </div>
        <span className="text-lg font-semibold tracking-tight text-white">SatMaza</span>
      </div>

      {/* ==================== PAINEL HERO — Desktop ==================== */}
      <div className="relative hidden w-full items-center justify-center overflow-hidden bg-primary lg:flex lg:w-1/2">
        {/* Decoração sutil */}
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/[0.03]" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-white/[0.03]" />

        {/* Conteúdo central */}
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
            <div className="relative h-12 w-12">
              <Image src="/logo.svg" alt="SatMaza" fill className="object-contain" priority />
            </div>
          </div>

          <div className="space-y-1.5 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              SatMaza
            </h1>
            <p className="text-sm text-white/50">
              Sistema de Assistência Técnica
            </p>
          </div>
        </div>

        {/* Rodapé discreto */}
        <div className="absolute bottom-5 flex items-center gap-1.5 text-[11px] text-white/30">
          <ShieldCheck className="h-3 w-3" />
          <span>Ambiente Seguro</span>
        </div>
      </div>

      {/* ==================== PAINEL FORMULÁRIO ==================== */}
      <div className="flex w-full flex-1 flex-col items-center justify-center bg-background px-6 py-12 lg:w-1/2 lg:px-12">
        <div className="w-full max-w-md space-y-8">
          {/* Cabeçalho do formulário */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
              Acesse sua conta
            </h2>
            <p className="text-sm text-muted-foreground">
              Insira suas credenciais para continuar
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Erro geral */}
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Campo Usuário */}
            <div className="space-y-2">
              <Label htmlFor="usuario" className="text-sm font-medium">
                Usuário
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <User className="h-4 w-4" />
                </div>
                <Input
                  id="usuario"
                  type="text"
                  placeholder="Código numérico ou e-mail"
                  autoComplete="username"
                  className="h-11 pl-10 transition-shadow duration-200 focus:ring-2 focus:ring-primary/20"
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
              <Label htmlFor="senha" className="text-sm font-medium">
                Senha
              </Label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="senha"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  className="h-11 pl-10 pr-10 transition-shadow duration-200 focus:ring-2 focus:ring-primary/20"
                  aria-invalid={!!errors.senha}
                  {...register("senha", {
                    required: "O campo senha é obrigatório",
                    minLength: { value: 6, message: "A senha deve ter no mínimo 6 caracteres" },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-150 hover:text-foreground"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
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
              className="h-11 w-full text-base font-semibold shadow-md shadow-primary/20 transition-all duration-200 hover:shadow-lg hover:shadow-primary/30"
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

          {/* Separador visual */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
          </div>

          {/* Contato de suporte */}
          <div className="flex items-center justify-center gap-2 pt-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>Suporte: (19) 99745-9819</span>
          </div>
        </div>
      </div>
    </div>
  )
}
