"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreateUserDto, UpdateUserDto, createUser, updateUser } from "@/lib/api/usuarios"
import { User, UserRole, UserRoleLabels } from "@/types"
import { useToast } from "@/components/ui/use-toast"

const formSchema = z.object({
    usuario: z.string().min(1, "Obrigatório"),
    nome: z.string().optional(),
    email: z.string().email("E-mail inválido").optional().or(z.literal("")),
    perfil: z.nativeEnum(UserRole),
    senha: z.string().min(6, "Mínimo 6 caracteres").optional().or(z.literal("")),
})

type FormData = z.infer<typeof formSchema>

interface UserDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    userToEdit?: User | null
    onSuccess: () => void
}

export function UserDialog({ open, onOpenChange, userToEdit, onSuccess }: UserDialogProps) {
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            usuario: "",
            nome: "",
            email: "",
            perfil: UserRole.REPRESENTANTE,
            senha: "",
        },
    })

    // Assistir o valor do perfil para renderizar no Select adequadamente
    const perfilValue = watch("perfil")

    useEffect(() => {
        if (userToEdit) {
            reset({
                usuario: userToEdit.usuario,
                nome: userToEdit.nome || "",
                email: userToEdit.email || "",
                perfil: userToEdit.tipo,
                senha: "",
            })
        } else {
            reset({
                usuario: "",
                nome: "",
                email: "",
                perfil: UserRole.REPRESENTANTE,
                senha: "",
            })
        }
    }, [userToEdit, reset, open])

    async function onSubmit(values: FormData) {
        setIsLoading(true)
        try {
            if (userToEdit) {
                // Edit
                const updateData: UpdateUserDto = {
                    nome: values.nome,
                    email: values.email || undefined,
                    tipo: values.perfil,
                }
                if (values.senha) {
                    updateData.senha = values.senha
                }
                await updateUser(userToEdit.id, updateData)
                toast({ title: "Usuário atualizado com sucesso" })
            } else {
                // Create
                if (!values.senha) {
                    // Manual error handling since we removed Form
                    toast({ variant: "destructive", title: "Senha obrigatória", description: "Senha é obrigatória para novos usuários" })
                    setIsLoading(false)
                    return
                }
                await createUser({
                    usuario: values.usuario,
                    nome: values.nome,
                    email: values.email || undefined,
                    tipo: values.perfil,
                    senha: values.senha,
                })
                toast({ title: "Usuário criado com sucesso" })
            }
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao salvar usuário",
                description: error instanceof Error ? error.message : "Erro desconhecido",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{userToEdit ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
                    <DialogDescription>
                        {userToEdit
                            ? "Edite as informações do usuário aqui. Clique em salvar quando terminar."
                            : "Preencha os dados para criar um novo usuário."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="usuario">Código / Usuário</Label>
                        <Input
                            id="usuario"
                            placeholder="Ex: 001"
                            {...register("usuario")}
                            disabled={!!userToEdit}
                        />
                        {errors.usuario && <p className="text-xs text-destructive">{errors.usuario.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="nome">Nome</Label>
                        <Input
                            id="nome"
                            placeholder="Nome completo"
                            {...register("nome")}
                        />
                        {errors.nome && <p className="text-xs text-destructive">{errors.nome.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                            id="email"
                            placeholder="email@exemplo.com"
                            {...register("email")}
                        />
                        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="perfil">Perfil</Label>
                        <Select
                            onValueChange={(val: UserRole) => setValue("perfil", val)}
                            value={perfilValue}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um perfil" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.values(UserRole).map((role) => (
                                    <SelectItem key={role} value={role}>
                                        {UserRoleLabels[role]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.perfil && <p className="text-xs text-destructive">{errors.perfil.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="senha">{userToEdit ? "Nova Senha (opcional)" : "Senha"}</Label>
                        <Input
                            id="senha"
                            type="password"
                            placeholder="******"
                            {...register("senha")}
                        />
                        {errors.senha && <p className="text-xs text-destructive">{errors.senha.message}</p>}
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </form>

            </DialogContent>
        </Dialog>
    )
}
