"use client"

import { useState, useEffect } from "react"
import { KeyRound, Eye, EyeOff, Plus, Pencil, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import {
    getRepreAtendentes,
    createRepreAtendente,
    updateRepreAtendente,
    deleteRepreAtendente,
    updateRepreAtendenteSenha,
    type RepreAtendente,
} from "@/lib/api/usuarios"

const TIPO_LABELS: Record<RepreAtendente["tipo"], string> = {
    REPRE_ATENDENTE: "Representante Comercial",
    CHEFE_REPRE_ATENDENTE: "Chefe Representante Comercial",
}

type FormState = {
    nome: string
    email: string
    tipo: RepreAtendente["tipo"]
    usuarios: string[]
    senha: string
}

const EMPTY_FORM: FormState = {
    nome: "",
    email: "",
    tipo: "REPRE_ATENDENTE",
    usuarios: [],
    senha: "",
}

export function RepreAtendenteSection() {
    const { toast } = useToast()
    const [repres, setRepres] = useState<RepreAtendente[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Dialog de senha
    const [senhaDialogOpen, setSenhaDialogOpen] = useState(false)
    const [selectedRepre, setSelectedRepre] = useState<RepreAtendente | null>(null)
    const [novaSenha, setNovaSenha] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Dialog de criar/editar
    const [formDialogOpen, setFormDialogOpen] = useState(false)
    const [repreToEdit, setRepreToEdit] = useState<RepreAtendente | null>(null)
    const [form, setForm] = useState<FormState>(EMPTY_FORM)
    const [codigoInput, setCodigoInput] = useState("")
    const [isSavingForm, setIsSavingForm] = useState(false)

    // Dialog de exclusão
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [repreToDelete, setRepreToDelete] = useState<RepreAtendente | null>(null)

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

    // ─── Senha ───────────────────────────────────────────────────────────

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

    // ─── Criar / Editar ──────────────────────────────────────────────────

    function handleCreate() {
        setRepreToEdit(null)
        setForm(EMPTY_FORM)
        setCodigoInput("")
        setFormDialogOpen(true)
    }

    function handleEdit(repre: RepreAtendente) {
        setRepreToEdit(repre)
        setForm({
            nome: repre.nome_representante_comercial,
            email: repre.email_representante_comercial,
            tipo: repre.tipo ?? "REPRE_ATENDENTE",
            usuarios: [...(repre.usuarios ?? [])],
            senha: "",
        })
        setCodigoInput("")
        setFormDialogOpen(true)
    }

    function handleAddCodigo() {
        const codigo = codigoInput.trim()
        if (!codigo) return
        if (form.usuarios.includes(codigo)) {
            setCodigoInput("")
            return
        }
        setForm((f) => ({ ...f, usuarios: [...f.usuarios, codigo] }))
        setCodigoInput("")
    }

    function handleRemoveCodigo(codigo: string) {
        setForm((f) => ({ ...f, usuarios: f.usuarios.filter((c) => c !== codigo) }))
    }

    const isChefe = form.tipo === "CHEFE_REPRE_ATENDENTE"
    const formValid =
        form.nome.trim().length > 0 &&
        /\S+@\S+\.\S+/.test(form.email) &&
        (form.senha === "" || form.senha.length >= 6)

    async function handleSalvarForm() {
        if (!formValid) return

        setIsSavingForm(true)
        try {
            if (repreToEdit) {
                await updateRepreAtendente(repreToEdit.id, {
                    nome_representante_comercial: form.nome.trim(),
                    email_representante_comercial: form.email.trim(),
                    tipo: form.tipo,
                    usuarios: form.usuarios,
                })
                toast({ title: "Representante comercial atualizado com sucesso" })
            } else {
                await createRepreAtendente({
                    nome_representante_comercial: form.nome.trim(),
                    email_representante_comercial: form.email.trim(),
                    tipo: form.tipo,
                    usuarios: form.usuarios,
                    senha: form.senha || undefined,
                })
                toast({ title: "Representante comercial criado com sucesso" })
            }
            setFormDialogOpen(false)
            loadRepres()
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao salvar representante comercial",
                description: error instanceof Error ? error.message : undefined,
            })
        } finally {
            setIsSavingForm(false)
        }
    }

    // ─── Excluir ─────────────────────────────────────────────────────────

    function handleDeleteClick(repre: RepreAtendente) {
        setRepreToDelete(repre)
        setDeleteDialogOpen(true)
    }

    async function handleConfirmDelete() {
        if (!repreToDelete) return
        try {
            await deleteRepreAtendente(repreToDelete.id)
            toast({ title: "Representante comercial excluído com sucesso" })
            loadRepres()
        } catch {
            toast({
                variant: "destructive",
                title: "Erro ao excluir representante comercial",
            })
        } finally {
            setDeleteDialogOpen(false)
            setRepreToDelete(null)
        }
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-lg">
                        Representantes Comerciais (Indicadores e Acompanhamento)
                    </CardTitle>
                    <Button size="sm" onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Novo
                    </Button>
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
                                        <TableHead className="hidden lg:table-cell">Perfil</TableHead>
                                        <TableHead className="hidden md:table-cell">Representantes</TableHead>
                                        <TableHead>Acesso</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                Carregando...
                                            </TableCell>
                                        </TableRow>
                                    ) : repres.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                Nenhum representante comercial cadastrado.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        repres.map((repre) => {
                                            const chefe = repre.tipo === "CHEFE_REPRE_ATENDENTE"
                                            return (
                                                <TableRow key={repre.id}>
                                                    <TableCell>{repre.id}</TableCell>
                                                    <TableCell>{repre.nome_representante_comercial}</TableCell>
                                                    <TableCell className="hidden sm:table-cell">
                                                        {repre.email_representante_comercial}
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell">
                                                        <Badge variant={chefe ? "default" : "secondary"}>
                                                            {chefe ? "Chefe" : "Comercial"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                        {chefe ? (
                                                            <span className="text-xs text-muted-foreground">
                                                                Todos os representantes
                                                            </span>
                                                        ) : repre.usuarios.length === 0 ? (
                                                            <span className="text-xs text-muted-foreground">
                                                                Nenhum vinculado — sem acesso a dados
                                                            </span>
                                                        ) : (
                                                            <div className="flex gap-1 flex-wrap">
                                                                {repre.usuarios.map((u) => (
                                                                    <Badge key={u} variant="secondary" className="text-xs">
                                                                        {u}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={repre.password_changed ? "default" : "outline"}>
                                                            {repre.password_changed ? "Ativo" : "Sem senha"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                title="Editar"
                                                                onClick={() => handleEdit(repre)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                title={`${repre.password_changed ? "Redefinir" : "Definir"} senha`}
                                                                onClick={() => handleDefinirSenha(repre)}
                                                            >
                                                                <KeyRound className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                title="Excluir"
                                                                className="text-destructive hover:text-destructive"
                                                                onClick={() => handleDeleteClick(repre)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </div>
                </CardContent>
            </Card>

            {/* Dialog criar/editar */}
            <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>
                            {repreToEdit ? "Editar Representante Comercial" : "Novo Representante Comercial"}
                        </DialogTitle>
                        <DialogDescription>
                            O Chefe Representante Comercial vê as SATs e indicadores de todos os
                            representantes; o Representante Comercial vê apenas os representantes
                            vinculados abaixo.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Nome</Label>
                            <Input
                                value={form.nome}
                                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                                placeholder="Nome completo"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>E-mail</Label>
                            <Input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                placeholder="email@empresa.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Perfil</Label>
                            <Select
                                value={form.tipo}
                                onValueChange={(v) =>
                                    setForm((f) => ({ ...f, tipo: v as RepreAtendente["tipo"] }))
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="REPRE_ATENDENTE">
                                        {TIPO_LABELS.REPRE_ATENDENTE}
                                    </SelectItem>
                                    <SelectItem value="CHEFE_REPRE_ATENDENTE">
                                        {TIPO_LABELS.CHEFE_REPRE_ATENDENTE}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {!isChefe && (
                            <div className="space-y-2">
                                <Label>Códigos dos representantes vinculados</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={codigoInput}
                                        onChange={(e) => setCodigoInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault()
                                                handleAddCodigo()
                                            }
                                        }}
                                        placeholder="Ex: 003"
                                    />
                                    <Button type="button" variant="outline" onClick={handleAddCodigo}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                {form.usuarios.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                        Sem representantes vinculados este usuário não verá nenhuma SAT.
                                    </p>
                                ) : (
                                    <div className="flex gap-1 flex-wrap">
                                        {form.usuarios.map((codigo) => (
                                            <Badge key={codigo} variant="secondary" className="text-xs gap-1">
                                                {codigo}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveCodigo(codigo)}
                                                    className="hover:text-destructive"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {!repreToEdit && (
                            <div className="space-y-2">
                                <Label>Senha (opcional)</Label>
                                <Input
                                    type="password"
                                    value={form.senha}
                                    onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
                                    placeholder="Mínimo 6 caracteres — pode ser definida depois"
                                />
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFormDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSalvarForm} disabled={!formValid || isSavingForm}>
                            {isSavingForm ? "Salvando..." : "Salvar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog de senha */}
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

            {/* Dialog de exclusão */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Essa ação não pode ser desfeita. Isso excluirá permanentemente o acesso de
                            <b> {repreToDelete?.nome_representante_comercial}</b>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleConfirmDelete}
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
