"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiPost, apiGet } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

const formSchema = z.object({
    email: z.string().email("E-mail inválido"),
    senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    confirmSenha: z.string(),
}).refine((data) => data.senha === data.confirmSenha, {
    message: "Senhas não conferem",
    path: ["confirmSenha"],
})

type FormData = z.infer<typeof formSchema>
type NomeStatus = "loading" | "loaded" | "error"

export default function CompleteRegistrationPage() {
    const { toast } = useToast()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [nomeStatus, setNomeStatus] = useState<NomeStatus>("loading")
    const { logout } = useAuth()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: "", senha: "", confirmSenha: "" },
    })

    // Intercepta o botão "Voltar" do navegador e trata como logout.
    // Ao montar, empurramos um estado duplicado no histórico para que o
    // primeiro "back" dispare o popstate ainda na mesma URL.
    // Quando o popstate chega, fazemos logout: limpamos tokens e
    // redirecionamos para /login via router, evitando bfcache.
    useEffect(() => {
        window.history.pushState(null, "", window.location.href)

        const handlePopState = () => {
            logout()
        }

        window.addEventListener("popstate", handlePopState)
        return () => window.removeEventListener("popstate", handlePopState)
    }, [logout])

    // Busca o nome no ERP logo ao montar a página
    useEffect(() => {
        apiGet<{ nome: string | null }>("/usuario/meu-nome-erp")
            .then((res) => {
                setNomeStatus(res.nome ? "loaded" : "error")
            })
            .catch(() => {
                setNomeStatus("error")
            })
    }, [])

    async function onSubmit(values: FormData) {
        // Se o nome do ERP ainda não foi carregado, não deixa prosseguir
        if (nomeStatus !== "loaded") {
            router.replace("/login?error=nome_erp")
            return
        }

        setIsLoading(true)
        try {
            await apiPost("/usuario/complete-registration", {
                email: values.email,
                senha: values.senha,
            })

            toast({
                title: "Cadastro completado!",
                description: "Seus dados foram atualizados com sucesso.",
            })

            window.location.href = "/dashboard"
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao atualizar cadastro",
                description:
                    error instanceof Error ? error.message : "Tente novamente mais tarde",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Completar Cadastro</CardTitle>
                    <CardDescription className="font-bold text-foreground">
                        É necessário atualizar seus dados e senha para continuar.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                    {/* Status da identificação no ERP */}
                    {nomeStatus === "loading" && (
                        <div className="flex items-center gap-2 rounded-lg border border-muted bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                            <span>Identificando seu perfil no sistema...</span>
                        </div>
                    )}
                    {nomeStatus === "loaded" && (
                        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            <span>Perfil identificado. Preencha seus dados abaixo.</span>
                        </div>
                    )}
                    {nomeStatus === "error" && (
                        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>
                                Não foi possível identificar seu perfil no sistema.
                                Se clicar em salvar, será redirecionado para tentar novamente.
                            </span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="font-bold">
                                E-mail <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="email"
                                placeholder="seu@email.com"
                                {...register("email")}
                            />
                            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="senha" className="font-bold">
                                Nova Senha <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="senha"
                                type="password"
                                placeholder="******"
                                {...register("senha")}
                            />
                            {errors.senha && <p className="text-xs text-destructive">{errors.senha.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmSenha" className="font-bold">
                                Confirmar Senha <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="confirmSenha"
                                type="password"
                                placeholder="******"
                                {...register("confirmSenha")}
                            />
                            {errors.confirmSenha && <p className="text-xs text-destructive">{errors.confirmSenha.message}</p>}
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar e Continuar
                            </Button>
                            <Button type="button" variant="outline" onClick={logout} className="w-full">
                                Sair
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
