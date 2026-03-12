"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Plus, Pencil, Trash2, Search, X } from "lucide-react"

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
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { UserDialog } from "@/components/user-dialog"
import { PageTemplate } from "@/components/page-template"
import { User, UserRole, UserRoleLabels } from "@/types"
import { getUsers, deleteUser } from "@/lib/api/usuarios"

export default function AdminUsersPage() {
    const { toast } = useToast()
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [userToEdit, setUserToEdit] = useState<User | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [userToDelete, setUserToDelete] = useState<User | null>(null)

    // Filtros
    const [searchQuery, setSearchQuery] = useState("")
    const [roleFilter, setRoleFilter] = useState<UserRole | "TODOS">("TODOS")

    async function loadUsers() {
        setIsLoading(true)
        try {
            const data = await getUsers()
            setUsers(data)
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao carregar usuários",
                description: "Não foi possível buscar a lista de usuários.",
            })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadUsers()
    }, [])

    const filteredUsers = useMemo(() => {
        let result = users

        if (roleFilter !== "TODOS") {
            result = result.filter((u) => u.tipo === roleFilter)
        }

        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase()
            result = result.filter(
                (u) =>
                    u.usuario.toLowerCase().includes(q) ||
                    (u.email && u.email.toLowerCase().includes(q))
            )
        }

        return result
    }, [users, roleFilter, searchQuery])

    const hasActiveFilters = roleFilter !== "TODOS" || searchQuery.trim() !== ""

    const clearFilters = useCallback(() => {
        setSearchQuery("")
        setRoleFilter("TODOS")
    }, [])

    function handleCreate() {
        setUserToEdit(null)
        setDialogOpen(true)
    }

    function handleEdit(user: User) {
        setUserToEdit(user)
        setDialogOpen(true)
    }

    function handleDeleteClick(user: User) {
        setUserToDelete(user)
        setDeleteDialogOpen(true)
    }

    async function handleConfirmDelete() {
        if (!userToDelete) return

        try {
            await deleteUser(userToDelete.id)
            toast({ title: "Usuário excluído com sucesso" })
            loadUsers()
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao excluir usuário",
                description: "Não foi possível excluir o usuário.",
            })
        } finally {
            setDeleteDialogOpen(false)
            setUserToDelete(null)
        }
    }

    return (
        <PageTemplate
            title="Gerenciamento de Usuários"
            description="Cadastre e gerencie os usuários do sistema"
            actions={
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Novo Usuário
                </Button>
            }
        >
            {/* Filtros */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Filtros
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-end">
                        <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                            <Label>Pesquisar</Label>
                            <Input
                                placeholder="Usuário ou e-mail..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Perfil</Label>
                            <Select
                                value={roleFilter}
                                onValueChange={(v) => setRoleFilter(v as UserRole | "TODOS")}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TODOS">Todos</SelectItem>
                                    {Object.values(UserRole).map((role) => (
                                        <SelectItem key={role} value={role}>
                                            {UserRoleLabels[role]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end gap-2">
                            {hasActiveFilters && (
                                <Button variant="outline" onClick={clearFilters} className="w-full">
                                    <X className="mr-2 h-4 w-4" />
                                    Limpar
                                </Button>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground self-end">
                            Exibindo {filteredUsers.length} de {users.length} usuários
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Tabela com scroll fixo */}
            <div className="rounded-md border">
                <ScrollArea className="h-[calc(100vh-420px)] min-h-[300px]">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>Usuário</TableHead>
                                <TableHead className="hidden sm:table-cell">E-mail</TableHead>
                                <TableHead>Perfil</TableHead>
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
                            ) : filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        Nenhum usuário encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>{user.id}</TableCell>
                                        <TableCell>{user.nome || "-"}</TableCell>
                                        <TableCell>{user.usuario}</TableCell>
                                        <TableCell className="hidden sm:table-cell">{user.email || "-"}</TableCell>
                                        <TableCell>{UserRoleLabels[user.tipo]}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(user)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDeleteClick(user)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </div>

            <UserDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                userToEdit={userToEdit}
                onSuccess={loadUsers}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Essa ação não pode ser desfeita. Isso excluirá permanentemente o usuário
                            <b> {userToDelete?.usuario} </b> e removerá seus dados do servidor.
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
        </PageTemplate>
    )
}
