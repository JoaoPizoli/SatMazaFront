"use client"

import { useEffect, useState } from "react"
import { List, Loader2, Mail, Plus, Send, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FeedbackBanner } from "@/components/feedback-banner"
import { ApiError } from "@/lib/api"
import { enviarRelatorio, getDestinatarios, mensagemDeErro, type PeriodoConsulta } from "@/lib/api/relatorio"
import { descreverPeriodo } from "@/lib/relatorio-periodo"
import { cn } from "@/lib/utils"

export type ModoDestinatarios = "lista" | "outros"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_DESTINATARIOS = 50

type Resultado = { tipo: "success" | "error" | "warning"; mensagem: string }

/**
 * Envio manual do relatório: para a lista de destinatários ativos ou para e-mails avulsos
 * (ex.: "Enviar teste para mim"). Remonte com `key` a cada abertura para reiniciar o estado.
 */
export function RelatorioEnviarDialog({
    open,
    onOpenChange,
    periodo,
    modoInicial = "lista",
    emailsIniciais = [],
    onEnviado,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    periodo: PeriodoConsulta
    modoInicial?: ModoDestinatarios
    emailsIniciais?: string[]
    onEnviado?: () => void
}) {
    const [modo, setModo] = useState<ModoDestinatarios>(modoInicial)
    const [emails, setEmails] = useState<string[]>(emailsIniciais)
    const [entrada, setEntrada] = useState("")
    const [erroEntrada, setErroEntrada] = useState<string | null>(null)
    const [ativos, setAtivos] = useState<string[] | null>(null)
    const [enviando, setEnviando] = useState(false)
    const [resultado, setResultado] = useState<Resultado | null>(null)

    useEffect(() => {
        let ativo = true
        getDestinatarios()
            .then((lista) => ativo && setAtivos(lista.filter((d) => d.ativo).map((d) => d.email)))
            .catch(() => ativo && setAtivos([]))
        return () => {
            ativo = false
        }
    }, [])

    /** Adiciona os e-mails digitados/colados (separados por vírgula, ponto e vírgula ou espaço). */
    function adicionarEmails(texto: string): string[] | null {
        const novos = texto.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean)
        if (novos.length === 0) return emails
        const invalido = novos.find((e) => !EMAIL_REGEX.test(e))
        if (invalido) {
            setErroEntrada(`E-mail inválido: ${invalido}`)
            return null
        }
        const lista = [...new Set([...emails, ...novos])]
        if (lista.length > MAX_DESTINATARIOS) {
            setErroEntrada(`Máximo de ${MAX_DESTINATARIOS} destinatários por envio.`)
            return null
        }
        setEmails(lista)
        setEntrada("")
        setErroEntrada(null)
        return lista
    }

    const concluido = resultado?.tipo === "success"
    const listaVazia = ativos !== null && ativos.length === 0
    const podeEnviar = !enviando && !concluido && (modo === "lista" ? !listaVazia && ativos !== null : emails.length > 0 || entrada.trim().length > 0)

    async function enviar() {
        let destinatarios: string[] | undefined
        if (modo === "outros") {
            const lista = entrada.trim() ? adicionarEmails(entrada) : emails
            if (!lista || lista.length === 0) return
            destinatarios = lista
        }

        setEnviando(true)
        setResultado(null)
        try {
            const envio = await enviarRelatorio({ ...periodo, destinatarios })
            setResultado(
                envio.status === "SUCESSO"
                    ? {
                        tipo: "success",
                        mensagem: `Relatório enviado para ${envio.destinatarios.length} ${envio.destinatarios.length === 1 ? "destinatário" : "destinatários"}.`,
                    }
                    : {
                        tipo: "error",
                        mensagem: `O envio falhou${envio.erro ? `: ${envio.erro.slice(0, 300)}` : "."} Verifique e tente novamente.`,
                    },
            )
        } catch (error) {
            const incerto = error instanceof ApiError && [0, 502, 503, 504].includes(error.status)
            setResultado(
                incerto
                    ? {
                        tipo: "warning",
                        mensagem: "Não foi possível confirmar o envio (tempo esgotado ou servidor indisponível). Confira a aba Histórico antes de enviar novamente.",
                    }
                    : { tipo: "error", mensagem: mensagemDeErro(error) },
            )
        } finally {
            setEnviando(false)
            onEnviado?.()
        }
    }

    return (
        <Dialog open={open} onOpenChange={(aberto) => !enviando && onOpenChange(aberto)}>
            <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                    <DialogTitle>Enviar relatório agora</DialogTitle>
                    <DialogDescription>
                        Relatório de <strong>{descreverPeriodo(periodo.startDate, periodo.endDate)}</strong>, com o PDF completo em anexo.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Destinatários">
                        {(
                            [
                                { valor: "lista", titulo: "Lista configurada", icone: List, detalhe: ativos === null ? "Carregando..." : `${ativos.length} ${ativos.length === 1 ? "destinatário ativo" : "destinatários ativos"}` },
                                { valor: "outros", titulo: "Outros e-mails", icone: Mail, detalhe: "Ex.: enviar um teste para você" },
                            ] as const
                        ).map((opcao) => (
                            <button
                                key={opcao.valor}
                                type="button"
                                role="radio"
                                aria-checked={modo === opcao.valor}
                                disabled={enviando || concluido}
                                onClick={() => setModo(opcao.valor)}
                                className={cn(
                                    "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors disabled:opacity-60",
                                    modo === opcao.valor ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50",
                                )}
                            >
                                <opcao.icone className={cn("mt-0.5 h-4 w-4 shrink-0", modo === opcao.valor ? "text-primary" : "text-muted-foreground")} />
                                <span>
                                    <span className="block text-sm font-medium">{opcao.titulo}</span>
                                    <span className="block text-xs text-muted-foreground">{opcao.detalhe}</span>
                                </span>
                            </button>
                        ))}
                    </div>

                    {modo === "lista" ? (
                        listaVazia ? (
                            <FeedbackBanner variant="warning">
                                Nenhum destinatário ativo. Cadastre e-mails na aba <strong>Destinatários</strong> ou use “Outros e-mails”.
                            </FeedbackBanner>
                        ) : (
                            ativos && (
                                <p className="text-xs text-muted-foreground break-words">
                                    Para: {ativos.join(", ")}
                                </p>
                            )
                        )
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor="relatorio-emails">E-mails</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="relatorio-emails"
                                    value={entrada}
                                    disabled={enviando || concluido}
                                    onChange={(e) => {
                                        setEntrada(e.target.value)
                                        setErroEntrada(null)
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === "," || e.key === ";") {
                                            e.preventDefault()
                                            adicionarEmails(entrada)
                                        }
                                    }}
                                    onPaste={(e) => {
                                        const colado = e.clipboardData.getData("text")
                                        if (/[\s,;]/.test(colado.trim())) {
                                            e.preventDefault()
                                            adicionarEmails(colado)
                                        }
                                    }}
                                    placeholder="nome@empresa.com.br"
                                    type="email"
                                    autoComplete="off"
                                />
                                <Button type="button" variant="outline" disabled={enviando || concluido} onClick={() => adicionarEmails(entrada)} aria-label="Adicionar e-mail">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {erroEntrada && <p className="text-xs text-destructive">{erroEntrada}</p>}
                            {emails.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {emails.map((email) => (
                                        <Badge key={email} variant="secondary" className="gap-1 text-xs">
                                            {email}
                                            <button
                                                type="button"
                                                disabled={enviando || concluido}
                                                onClick={() => setEmails((lista) => lista.filter((e) => e !== email))}
                                                className="hover:text-destructive"
                                                aria-label={`Remover ${email}`}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {resultado && <FeedbackBanner variant={resultado.tipo}>{resultado.mensagem}</FeedbackBanner>}
                </div>

                <DialogFooter>
                    <Button variant="outline" disabled={enviando} onClick={() => onOpenChange(false)}>
                        {concluido ? "Fechar" : "Cancelar"}
                    </Button>
                    {!concluido && (
                        <Button onClick={enviar} disabled={!podeEnviar}>
                            {enviando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            {enviando ? "Enviando..." : "Enviar"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
