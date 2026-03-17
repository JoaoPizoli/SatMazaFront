"use client"

import { useState, useEffect } from "react"
import { KeyRound, Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import {
    getRepreAtendentes,
    updateRepreAtendenteSenha,
    type RepreAtendente,
} from "@/lib/api/usuarios"

export function RepreAtendenteSection() {
    const { toast } = useToast()
    const [repres, setRepres] = useState<RepreAtendente[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [senhaDialogOpen, setSenhaDialogOpen] = useState(false)
    const [selectedRepre, setSelectedRepre] = useState<RepreAtendente | null>(null)
    const [novaSenha, setNovaSenha] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    async function loadRepres() {
        setIsLoading(true)
        try {
            const data = await getRepreAtendentes()
            setRepres(data)
        } catch {
            toast({
                variant: "destructive",
                title: "Erro ao carregar representantes comerciais",
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadRepres()
    }, [])

    function handleDefinirSenha(repre: RepreAtendente) {
        setSelectedRepre(repre)
        setNovaSenha("")
        setShowPassword(false)
        setSenhaDialogOpen(true)
    }

    async function handleSalvarSenha() {
        if (!selectedRepre || novaSenha.length < 6) return

        setIsSaving(true)
        try {
            await updateRepreAtendenteSenha(selectedRepre.id, novaSenha)
            toast({ title: "Senha definida com sucesso" })
            setSenhaDialogOpen(false)
            loadRepres()
        } catch {
            toast({
                variant: "destructive",
                title: "Erro ao definir senha",
            })
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Representantes Comerciais (Acesso Indicadores)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <ScrollArea className="max-h-[400px]">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background z-10">
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Nome</TableHead>
                                        <TableHead className="hidden sm:table-cell">E-mail</TableHead>
                                        <TableHead className="hidden md:table-cell">Atendentes</TableHead>
                                        <TableHead>Acesso</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                Carregando...
                                            </TableCell>
                                        </TableRow>
                                    ) : repres.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                Nenhum representante comercial cadastrado.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        repres.map((repre) => (
                                            <TableRow key={repre.id}>
                                                <TableCell>{repre.id}</TableCell>
                                                <TableCell>{repre.nome_representante_comercial}</TableCell>
                                                <TableCell className="hidden sm:table-cell">
                                                    {repre.email_representante_comercial}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <div className="flex gap-1 flex-wrap">
                                                        {repre.usuarios.map((u) => (
                                                            <Badge key={u} variant="secondary" className="text-xs">
                                                                {u}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={repre.password_changed ? "default" : "outline"}>
                                                        {repre.password_changed ? "Ativo" : "Sem senha"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDefinirSenha(repre)}
                                                    >
                                                        <KeyRound className="mr-2 h-4 w-4" />
                                                        {repre.password_changed ? "Redefinir" : "Definir"} Senha
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={senhaDialogOpen} onOpenChange={setSenhaDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {selectedRepre?.password_changed ? "Redefinir" : "Definir"} Senha
                        </DialogTitle>
                        <DialogDescription>
                            {selectedRepre?.nome_representante_comercial} ({selectedRepre?.email_representante_comercial})
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nova Senha</label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    value={novaSenha}
                                    onChange={(e) => setNovaSenha(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    minLength={6}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSenhaDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSalvarSenha}
                            disabled={novaSenha.length < 6 || isSaving}
                        >
                            {isSaving ? "Salvando..." : "Salvar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
