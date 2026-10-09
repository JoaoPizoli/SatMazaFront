"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, LogOut, MessageCircle, QrCode, RefreshCw, Send } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FeedbackBanner } from "@/components/feedback-banner"
import { mensagemDeErro } from "@/lib/api/relatorio"
import { conectarWhatsapp, desconectarWhatsapp, enviarTesteWhatsapp, getWhatsappStatus } from "@/lib/api/whatsapp"
import { formatarDataHoraBR } from "@/lib/relatorio-periodo"
import { formatarTelefoneBR, normalizarTelefone } from "@/lib/telefone"
import { cn } from "@/lib/utils"
import type { WhatsappSituacao, WhatsappStatus } from "@/types"

// Enquanto o QR está na tela (ou conectando) a situação muda sozinha; nos outros estados basta o botão Atualizar
const INTERVALO_POLLING_MS = 5_000
const SITUACOES_TRANSITORIAS: WhatsappSituacao[] = ["AGUARDANDO_QR", "CONECTANDO"]

const SITUACAO: Record<WhatsappSituacao, { rotulo: string; classe: string }> = {
    CONECTADO: { rotulo: "Conectado", classe: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    AGUARDANDO_QR: { rotulo: "Aguardando leitura do QR", classe: "border-amber-200 bg-amber-50 text-amber-800" },
    CONECTANDO: { rotulo: "Conectando", classe: "border-slate-200 bg-slate-50 text-slate-600" },
    DESCONECTADO: { rotulo: "Desconectado", classe: "border-red-200 bg-red-50 text-red-700" },
}

export function WhatsappSituacaoBadge({ situacao }: { situacao: WhatsappSituacao }) {
    const { rotulo, classe } = SITUACAO[situacao]
    return (
        <Badge variant="outline" className={cn("whitespace-nowrap", classe)}>
            {rotulo}
        </Badge>
    )
}

type Acao = "conectar" | "desconectar" | "teste" | null

export function RelatorioWhatsappTab() {
    const [status, setStatus] = useState<WhatsappStatus | null>(null)
    const [carregando, setCarregando] = useState(true)
    const [acao, setAcao] = useState<Acao>(null)
    const [telefoneTeste, setTelefoneTeste] = useState("")
    const [confirmarDesconexao, setConfirmarDesconexao] = useState(false)
    const [aviso, setAviso] = useState<{ tipo: "success" | "error" | "warning"; mensagem: string } | null>(null)

    const carregar = useCallback(async (silencioso = false) => {
        if (!silencioso) setCarregando(true)
        try {
            setStatus(await getWhatsappStatus())
        } catch (error) {
            if (!silencioso) setAviso({ tipo: "error", mensagem: mensagemDeErro(error) })
        } finally {
            if (!silencioso) setCarregando(false)
        }
    }, [])

    useEffect(() => {
        carregar()
    }, [carregar])

    const situacao = status?.situacao
    useEffect(() => {
        if (!situacao || !SITUACOES_TRANSITORIAS.includes(situacao)) return
        const timer = setInterval(() => carregar(true), INTERVALO_POLLING_MS)
        return () => clearInterval(timer)
    }, [situacao, carregar])

    async function executar(tipo: Exclude<Acao, null>, chamada: () => Promise<WhatsappStatus>, sucesso?: string) {
        setAcao(tipo)
        setAviso(null)
        try {
            setStatus(await chamada())
            if (sucesso) setAviso({ tipo: "success", mensagem: sucesso })
        } catch (error) {
            setAviso({ tipo: "error", mensagem: mensagemDeErro(error) })
        } finally {
            setAcao(null)
        }
    }

    async function enviarTeste(e: React.FormEvent) {
        e.preventDefault()
        const telefone = normalizarTelefone(telefoneTeste)
        if (!telefone) {
            setAviso({ tipo: "error", mensagem: "Informe um telefone válido com DDD (ex.: 11 99999-8888)." })
            return
        }
        setAcao("teste")
        setAviso(null)
        try {
            await enviarTesteWhatsapp(telefone)
            setAviso({ tipo: "success", mensagem: `Mensagem de teste enviada para ${formatarTelefoneBR(telefone)}.` })
            setTelefoneTeste("")
        } catch (error) {
            setAviso({ tipo: "error", mensagem: mensagemDeErro(error) })
        } finally {
            setAcao(null)
        }
    }

    if (carregando && !status) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        )
    }

    const ocupado = acao !== null

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
                <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1.5">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <MessageCircle className="h-5 w-5" />
                            Número do bot
                            {status && <WhatsappSituacaoBadge situacao={status.situacao} />}
                        </CardTitle>
                        <CardDescription>
                            O relatório é enviado pelo WhatsApp a partir do número conectado aqui. Use um chip dedicado da empresa.
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => carregar()} disabled={carregando || ocupado}>
                        {carregando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Atualizar
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {status && !status.ativo && (
                        <FeedbackBanner variant="info">
                            O canal WhatsApp está desligado neste servidor (<code>WHATSAPP_ATIVO</code>). Os envios por WhatsApp não acontecerão até que seja ligado.
                        </FeedbackBanner>
                    )}

                    {aviso && (
                        <FeedbackBanner variant={aviso.tipo} onClose={() => setAviso(null)}>
                            {aviso.mensagem}
                        </FeedbackBanner>
                    )}

                    {status?.situacao === "DESCONECTADO" && (
                        <div className="space-y-3">
                            {status.ultimoErro && <FeedbackBanner variant="warning">{status.ultimoErro}</FeedbackBanner>}
                            <p className="text-sm text-muted-foreground">
                                {status.credenciaisSalvas
                                    ? "Há uma sessão salva deste número. Reconecte sem precisar ler o QR code de novo."
                                    : "Nenhum número conectado. Gere um QR code e leia com o celular que será o bot de envio."}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Button onClick={() => executar("conectar", conectarWhatsapp)} disabled={ocupado || status.ativo === false}>
                                    {acao === "conectar" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
                                    {status.credenciaisSalvas ? "Reconectar" : "Conectar (gerar QR code)"}
                                </Button>
                                {status.credenciaisSalvas && (
                                    <Button variant="outline" onClick={() => setConfirmarDesconexao(true)} disabled={ocupado}>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Encerrar sessão salva
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {status?.situacao === "CONECTANDO" && (
                        <div className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            Conectando ao WhatsApp... a situação é atualizada automaticamente.
                        </div>
                    )}

                    {status?.situacao === "AGUARDANDO_QR" && (
                        <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
                            <div className="flex flex-col items-center gap-2">
                                {status.qr ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={status.qr} alt="QR code para conectar o WhatsApp" width={256} height={256} className="rounded-lg border bg-white p-2" />
                                ) : (
                                    <div className="flex h-64 w-64 items-center justify-center rounded-lg border">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                )}
                                {status.qrGeradoEm && (
                                    <p className="text-xs text-muted-foreground">Gerado às {formatarDataHoraBR(status.qrGeradoEm).slice(-5)} · renova sozinho</p>
                                )}
                            </div>
                            <div className="space-y-3 text-sm">
                                <p className="font-medium">No celular que será o bot:</p>
                                <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                                    <li>Abra o WhatsApp e toque em <strong>Mais opções</strong> (⋮) ou <strong>Configurações</strong>.</li>
                                    <li>Toque em <strong>Aparelhos conectados</strong> › <strong>Conectar um aparelho</strong>.</li>
                                    <li>Aponte a câmera para o QR code ao lado.</li>
                                </ol>
                                <p className="text-xs text-muted-foreground">
                                    A tela se atualiza sozinha. Se o QR expirar sem ser lido, clique em Conectar novamente.
                                </p>
                                <Button variant="outline" size="sm" onClick={() => executar("desconectar", desconectarWhatsapp)} disabled={ocupado}>
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    )}

                    {status?.situacao === "CONECTADO" && (
                        <div className="space-y-4">
                            <div className="grid gap-3 rounded-lg border p-4 text-sm sm:grid-cols-3">
                                <div>
                                    <p className="text-muted-foreground">Número</p>
                                    <p className="font-medium">{status.numero ? formatarTelefoneBR(status.numero) : "—"}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Nome no WhatsApp</p>
                                    <p className="font-medium">{status.nome || "—"}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Conectado desde</p>
                                    <p className="font-medium">{status.conectadoEm ? formatarDataHoraBR(status.conectadoEm) : "—"}</p>
                                </div>
                            </div>

                            <form onSubmit={enviarTeste} className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_auto]">
                                <div className="space-y-2">
                                    <Label htmlFor="whatsapp-teste">Enviar mensagem de teste para</Label>
                                    <Input
                                        id="whatsapp-teste"
                                        value={telefoneTeste}
                                        onChange={(e) => setTelefoneTeste(e.target.value)}
                                        placeholder="11 99999-8888"
                                        inputMode="tel"
                                        autoComplete="off"
                                        disabled={ocupado}
                                    />
                                </div>
                                <Button type="submit" variant="outline" disabled={ocupado || !telefoneTeste.trim()}>
                                    {acao === "teste" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    Enviar teste
                                </Button>
                            </form>

                            <div className="flex justify-end border-t pt-4">
                                <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setConfirmarDesconexao(true)} disabled={ocupado}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Desconectar e encerrar sessão
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="text-lg">Como funciona</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <ul className="list-disc space-y-1.5 pl-4">
                        <li>Os destinatários com telefone cadastrado recebem o PDF do relatório com um resumo na mensagem.</li>
                        <li>O envio por WhatsApp acontece em segundo plano, um número por vez; o resultado aparece na aba <strong>Histórico</strong>.</li>
                        <li>O celular do bot pode ficar offline, mas precisa abrir o WhatsApp pelo menos a cada 14 dias para a sessão não expirar.</li>
                        <li>Se o servidor reiniciar, a conexão volta sozinha com a sessão salva.</li>
                    </ul>
                    <FeedbackBanner variant="warning">
                        Esta integração usa uma API não oficial do WhatsApp (fora dos termos de uso da Meta). O número pode ser bloqueado sem aviso:
                        use um chip dedicado, poucos destinatários e evite outros usos automatizados nele.
                    </FeedbackBanner>
                </CardContent>
            </Card>

            <AlertDialog open={confirmarDesconexao} onOpenChange={setConfirmarDesconexao}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Encerrar a sessão do WhatsApp?</AlertDialogTitle>
                        <AlertDialogDescription>
                            O número sai de “Aparelhos conectados” e a sessão salva é apagada. Para voltar a enviar, será preciso ler um novo QR code.
                            Os envios por WhatsApp (manuais e automáticos) falharão até lá.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            onClick={() => executar("desconectar", desconectarWhatsapp, "Sessão do WhatsApp encerrada.")}
                        >
                            Encerrar sessão
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
