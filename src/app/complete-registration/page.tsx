"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiPost } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

const formSchema = z.object({
    nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    email: z.string().email("E-mail inválido"),
    senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    confirmSenha: z.string(),
}).refine((data) => data.senha === data.confirmSenha, {
    message: "Senhas não conferem",
    path: ["confirmSenha"],
})

type FormData = z.infer<typeof formSchema>

export default function CompleteRegistrationPage() {
    const { toast } = useToast()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const { logout } = useAuth()

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nome: "",
            email: "",
            senha: "",
            confirmSenha: "",
        },
    })

    async function onSubmit(values: FormData) {
        setIsLoading(true)
        try {
            await apiPost("/usuario/complete-registration", {
                nome: values.nome,
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
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="nome" className="font-bold">
                                Nome Completo <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="nome"
                                placeholder="Seu nome"
                                {...register("nome")}
                            />
                            {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
                        </div>

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
