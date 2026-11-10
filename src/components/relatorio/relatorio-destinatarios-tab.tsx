"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FeedbackBanner } from "@/components/feedback-banner"
import {
    createDestinatario,
    deleteDestinatario,
    getDestinatarios,
    mensagemDeErro,
    updateDestinatario,
} from "@/lib/api/relatorio"
import { formatarTelefoneBR, normalizarTelefone } from "@/lib/telefone"
import type { RelatorioDestinatario } from "@/types"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Como o destinatário é citado em mensagens: e-mail, ou o telefone quando só tem WhatsApp. */
export function rotuloDestinatario(destinatario: RelatorioDestinatario): string {
    return destinatario.email ?? (destinatario.telefone ? formatarTelefoneBR(destinatario.telefone) : `#${destinatario.id}`)
}

type ContatoValidado = { email: string | null; telefone: string | null }

/** E-mail e/ou telefone digitados → valores normalizados como o backend grava, ou a mensagem de erro. */
function validarContato(email: string, telefone: string): ContatoValidado | { erro: string } {
    const emailNormalizado = email.trim().toLowerCase()
    const telefoneDigitado = telefone.trim()
    if (!emailNormalizado && !telefoneDigitado) return { erro: "Informe um e-mail ou um telefone de WhatsApp." }
    if (emailNormalizado && !EMAIL_REGEX.test(emailNormalizado)) return { erro: "Informe um e-mail válido." }
    const telefoneNormalizado = telefoneDigitado ? normalizarTelefone(telefoneDigitado) : null
    if (telefoneDigitado && !telefoneNormalizado) return { erro: "Telefone inválido: informe DDD e número (ex.: 11 99999-8888)." }
    return { email: emailNormalizado || null, telefone: telefoneNormalizado }
}

export function RelatorioDestinatariosTab() {
    const [destinatarios, setDestinatarios] = useState<RelatorioDestinatario[]>([])
    const [carregando, setCarregando] = useState(true)
    const [email, setEmail] = useState("")
    const [telefone, setTelefone] = useState("")
    const [nome, setNome] = useState("")
    const [salvando, setSalvando] = useState(false)
    const [alterando, setAlterando] = useState<number | null>(null)
    const [paraEditar, setParaEditar] = useState<RelatorioDestinatario | null>(null)
    const [paraRemover, setParaRemover] = useState<RelatorioDestinatario | null>(null)
    const [aviso, setAviso] = useState<{ tipo: "success" | "error"; mensagem: string } | null>(null)

    const carregar = useCallback(async () => {
        setCarregando(true)
        try {
            setDestinatarios(await getDestinatarios())
        } catch (error) {
            setAviso({ tipo: "error", mensagem: mensagemDeErro(error) })
        } finally {
            setCarregando(false)
        }
    }, [])

    useEffect(() => {
        carregar()
    }, [carregar])

    async function adicionar(e: React.FormEvent) {
        e.preventDefault()
        const contato = validarContato(email, telefone)
        if ("erro" in contato) {
            setAviso({ tipo: "error", mensagem: contato.erro })
            return
        }

        setSalvando(true)
        setAviso(null)
        try {
            const criado = await createDestinatario({
                email: contato.email ?? undefined,
                telefone: contato.telefone ?? undefined,
                nome: nome.trim() || undefined,
            })
            setEmail("")
            setTelefone("")
            setNome("")
            setAviso({ tipo: "success", mensagem: `${rotuloDestinatario(criado)} foi adicionado à lista.` })
            await carregar()
        } catch (error) {
            setAviso({ tipo: "error", mensagem: mensagemDeErro(error) })
        } finally {
            setSalvando(false)
        }
    }

    async function alternarAtivo(destinatario: RelatorioDestinatario, ativo: boolean) {
        setAlterando(destinatario.id)
        setAviso(null)
        try {
            const atualizado = await updateDestinatario(destinatario.id, { ativo })
            setDestinatarios((lista) => lista.map((d) => (d.id === atualizado.id ? atualizado : d)))
        } catch (error) {
            setAviso({ tipo: "error", mensagem: mensagemDeErro(error) })
        } finally {
            setAlterando(null)
        }
    }

    function aoSalvarEdicao(atualizado: RelatorioDestinatario) {
        // Troca no lugar (como o Switch), sem recarregar a lista nem mudar a ordem
        setDestinatarios((lista) => lista.map((d) => (d.id === atualizado.id ? atualizado : d)))
        setParaEditar(null)
        setAviso({ tipo: "success", mensagem: `${rotuloDestinatario(atualizado)} foi atualizado.` })
    }

    async function remover() {
        if (!paraRemover) return
        const alvo = paraRemover
        setParaRemover(null)
        setAviso(null)
        try {
            await deleteDestinatario(alvo.id)
            setDestinatarios((lista) => lista.filter((d) => d.id !== alvo.id))
            setAviso({ tipo: "success", mensagem: `${rotuloDestinatario(alvo)} foi removido da lista.` })
        } catch (error) {
            setAviso({ tipo: "error", mensagem: mensagemDeErro(error) })
        }
    }

    const ativos = destinatarios.filter((d) => d.ativo)
    const ativosEmail = ativos.filter((d) => d.email).length
    const ativosWhatsapp = ativos.filter((d) => d.telefone).length
    const podeAdicionar = !salvando && (email.trim().length > 0 || telefone.trim().length > 0)

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Adicionar destinatário</CardTitle>
                    <CardDescription>
                        Informe e-mail, telefone de WhatsApp ou os dois. Os destinatários ativos recebem o envio automático mensal e os envios para a “lista configurada”.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={adicionar} className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1.5fr_1.5fr_auto]">
                        <div className="space-y-2">
                            <Label htmlFor="destinatario-email">E-mail</Label>
                            <Input
                                id="destinatario-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="gerencia@empresa.com.br"
                                autoComplete="off"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="destinatario-telefone">WhatsApp</Label>
                            <Input
                                id="destinatario-telefone"
                                value={telefone}
                                onChange={(e) => setTelefone(e.target.value)}
                                placeholder="11 99999-8888"
                                inputMode="tel"
                                autoComplete="off"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="destinatario-nome">Nome (opcional)</Label>
                            <Input
                                id="destinatario-nome"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                placeholder="Ex.: Gerência Comercial"
                                maxLength={120}
                            />
                        </div>
                        <Button type="submit" disabled={!podeAdicionar}>
                            {salvando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            Adicionar
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {aviso && (
                <FeedbackBanner variant={aviso.tipo} onClose={() => setAviso(null)}>
                    {aviso.mensagem}
                </FeedbackBanner>
            )}

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Destinatários</CardTitle>
                    <CardDescription>
                        {ativos.length} {ativos.length === 1 ? "ativo" : "ativos"} de {destinatarios.length} ({ativosEmail} por e-mail, {ativosWhatsapp} por WhatsApp).
                        Desative para pausar o recebimento sem remover o contato.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>E-mail</TableHead>
                                    <TableHead>WhatsApp</TableHead>
                                    <TableHead className="hidden sm:table-cell">Nome</TableHead>
                                    <TableHead>Recebe</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {carregando ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">Carregando...</TableCell>
                                    </TableRow>
                                ) : destinatarios.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            Nenhum destinatário cadastrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    destinatarios.map((destinatario) => (
                                        <TableRow key={destinatario.id} className={destinatario.ativo ? undefined : "text-muted-foreground"}>
                                            <TableCell className="font-medium break-all">{destinatario.email ?? <span className="text-muted-foreground">—</span>}</TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                {destinatario.telefone ? formatarTelefoneBR(destinatario.telefone) : <span className="text-muted-foreground">—</span>}
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">{destinatario.nome || "—"}</TableCell>
                                            <TableCell>
                                                <Switch
                                                    checked={destinatario.ativo}
                                                    disabled={alterando === destinatario.id}
                                                    onCheckedChange={(ativo) => alternarAtivo(destinatario, ativo)}
                                                    aria-label={`${destinatario.ativo ? "Desativar" : "Ativar"} ${rotuloDestinatario(destinatario)}`}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setParaEditar(destinatario)}
                                                        aria-label={`Editar ${rotuloDestinatario(destinatario)}`}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => setParaRemover(destinatario)}
                                                        aria-label={`Remover ${rotuloDestinatario(destinatario)}`}
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
                    </div>
                </CardContent>
            </Card>

            {paraEditar && (
                <EditarDestinatarioDialog
                    key={paraEditar.id}
                    destinatario={paraEditar}
                    onClose={() => setParaEditar(null)}
                    onSalvo={aoSalvarEdicao}
                />
            )}

            <AlertDialog open={!!paraRemover} onOpenChange={(aberto) => !aberto && setParaRemover(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover destinatário?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>{paraRemover ? rotuloDestinatario(paraRemover) : ""}</strong> deixará de receber o relatório de SATs. Para apenas pausar, desative o recebimento.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction variant="destructive" onClick={remover}>
                            Remover
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

type AlteracoesDestinatario = { email?: string | null; telefone?: string | null; nome?: string }

/**
 * Edita e-mail, WhatsApp e nome de um destinatário. Envia só o que mudou e não mexe em "Recebe"
 * (ativo) nem no histórico de envios. Remonte com `key` a cada abertura.
 */
function EditarDestinatarioDialog({
    destinatario,
    onClose,
    onSalvo,
}: {
    destinatario: RelatorioDestinatario
    onClose: () => void
    onSalvo: (atualizado: RelatorioDestinatario) => void
}) {
    const [email, setEmail] = useState(destinatario.email ?? "")
    const [telefone, setTelefone] = useState(destinatario.telefone ? formatarTelefoneBR(destinatario.telefone) : "")
    const [nome, setNome] = useState(destinatario.nome ?? "")
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)

    async function salvar(e: React.FormEvent) {
        e.preventDefault()
        const contato = validarContato(email, telefone)
        if ("erro" in contato) {
            setErro(contato.erro)
            return
        }

        // Campo esvaziado: null limpa o contato e "" limpa o nome (o backend grava null)
        const alteracoes: AlteracoesDestinatario = {}
        if (contato.email !== destinatario.email) alteracoes.email = contato.email
        if (contato.telefone !== destinatario.telefone) alteracoes.telefone = contato.telefone
        if (nome.trim() !== (destinatario.nome ?? "")) alteracoes.nome = nome.trim()
        if (Object.keys(alteracoes).length === 0) {
            onClose()
            return
        }

        setSalvando(true)
        setErro(null)
        try {
            onSalvo(await updateDestinatario(destinatario.id, alteracoes))
        } catch (error) {
            setErro(mensagemDeErro(error))
        } finally {
            setSalvando(false)
        }
    }

    return (
        <Dialog open onOpenChange={(aberto) => !aberto && !salvando && onClose()}>
            <DialogContent className="sm:max-w-[480px]">
                <form onSubmit={salvar} className="grid gap-4">
                    <DialogHeader>
                        <DialogTitle>Editar destinatário</DialogTitle>
                        <DialogDescription>
                            Informe e-mail, telefone de WhatsApp ou os dois. A opção “Recebe” e o histórico de envios continuam como estão.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Label htmlFor="editar-destinatario-email">E-mail</Label>
                        <Input
                            id="editar-destinatario-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="gerencia@empresa.com.br"
                            autoComplete="off"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="editar-destinatario-telefone">WhatsApp</Label>
                        <Input
                            id="editar-destinatario-telefone"
                            value={telefone}
                            onChange={(e) => setTelefone(e.target.value)}
                            placeholder="11 99999-8888"
                            inputMode="tel"
                            autoComplete="off"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="editar-destinatario-nome">Nome (opcional)</Label>
                        <Input
                            id="editar-destinatario-nome"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder="Ex.: Gerência Comercial"
                            maxLength={120}
                        />
                    </div>

                    {erro && <FeedbackBanner variant="error">{erro}</FeedbackBanner>}

                    <DialogFooter>
                        <Button type="button" variant="outline" disabled={salvando} onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={salvando}>
                            {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {salvando ? "Salvando..." : "Salvar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
