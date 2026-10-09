"use client"

import { useEffect, useState } from "react"
import { List, Loader2, Mail, MessageCircle, Plus, Send, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FeedbackBanner } from "@/components/feedback-banner"
import { ApiError } from "@/lib/api"
import { enviarRelatorio, getDestinatarios, mensagemDeErro, type PeriodoConsulta } from "@/lib/api/relatorio"
import { getWhatsappStatus } from "@/lib/api/whatsapp"
import { descreverPeriodo } from "@/lib/relatorio-periodo"
import { formatarTelefoneBR, normalizarTelefone, pareceTelefone } from "@/lib/telefone"
import { cn } from "@/lib/utils"
import type { RelatorioEnvio, RelatorioEnvioCanal, WhatsappStatus } from "@/types"

export type ModoDestinatarios = "lista" | "outros"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_DESTINATARIOS = 50

type Contato = { tipo: "email" | "telefone"; valor: string }
type Resultado = { tipo: "success" | "error" | "warning" | "info"; mensagem: string }
type Ativos = { emails: string[]; telefones: string[] }

const plural = (n: number, singular: string, plural: string) => `${n} ${n === 1 ? singular : plural}`

/** Texto de cada registro devolvido pelo backend (um por canal). */
function descreverEnvio(envio: RelatorioEnvio): Resultado {
    const n = envio.destinatarios.length
    const erro = envio.erro ? `: ${envio.erro.slice(0, 300)}` : "."
    if (envio.canal === "EMAIL") {
        return envio.status === "SUCESSO"
            ? { tipo: "success", mensagem: `E-mail enviado para ${plural(n, "destinatário", "destinatários")}.` }
            : { tipo: "error", mensagem: `O envio por e-mail falhou${erro} Verifique e tente novamente.` }
    }
    switch (envio.status) {
        case "PROCESSANDO":
            return {
                tipo: "info",
                mensagem: `WhatsApp: envio iniciado em segundo plano para ${plural(n, "número", "números")}. Acompanhe o resultado na aba Histórico.`,
            }
        case "SUCESSO":
            return { tipo: "success", mensagem: `WhatsApp enviado para ${plural(n, "número", "números")}.` }
        case "PARCIAL":
            return { tipo: "warning", mensagem: `WhatsApp enviado parcialmente${erro}` }
        default:
            return { tipo: "error", mensagem: `O envio por WhatsApp falhou${erro}` }
    }
}

/**
 * Envio manual do relatório: para a lista de destinatários ativos (e-mail e/ou WhatsApp) ou para
 * e-mails/telefones avulsos (ex.: "Enviar teste para mim"). Remonte com `key` a cada abertura.
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
    const [contatos, setContatos] = useState<Contato[]>(emailsIniciais.map((valor) => ({ tipo: "email", valor })))
    const [entrada, setEntrada] = useState("")
    const [erroEntrada, setErroEntrada] = useState<string | null>(null)
    const [ativos, setAtivos] = useState<Ativos | null>(null)
    const [whatsapp, setWhatsapp] = useState<WhatsappStatus | null>(null)
    const [canais, setCanais] = useState<Record<RelatorioEnvioCanal, boolean>>({ EMAIL: true, WHATSAPP: false })
    const [enviando, setEnviando] = useState(false)
    const [resultados, setResultados] = useState<Resultado[] | null>(null)

    useEffect(() => {
        let ativo = true
        Promise.all([getDestinatarios(), getWhatsappStatus().catch(() => null)])
            .then(([lista, status]) => {
                if (!ativo) return
                const ativosLista = lista.filter((d) => d.ativo)
                const emails = ativosLista.map((d) => d.email).filter((e): e is string => !!e)
                const telefones = ativosLista.map((d) => d.telefone).filter((t): t is string => !!t)
                setAtivos({ emails, telefones })
                setWhatsapp(status)
                // Padrão: os canais que têm destinatários (WhatsApp só se estiver conectado)
                setCanais({ EMAIL: emails.length > 0, WHATSAPP: telefones.length > 0 && status?.situacao === "CONECTADO" })
            })
            .catch(() => ativo && setAtivos({ emails: [], telefones: [] }))
        return () => {
            ativo = false
        }
    }, [])

    /** Adiciona e-mails/telefones digitados ou colados (separados por vírgula, ponto e vírgula ou quebra de linha). */
    function adicionarContatos(texto: string): Contato[] | null {
        const partes = texto.split(/[,;\n]+/).map((p) => p.trim()).filter(Boolean)
        if (partes.length === 0) return contatos

        const novos: Contato[] = []
        for (const parte of partes) {
            if (pareceTelefone(parte)) {
                const telefone = normalizarTelefone(parte)
                if (!telefone) {
                    setErroEntrada(`Telefone inválido: ${parte} (informe DDD e número)`)
                    return null
                }
                novos.push({ tipo: "telefone", valor: telefone })
            } else {
                const email = parte.toLowerCase()
                if (!EMAIL_REGEX.test(email)) {
                    setErroEntrada(`E-mail inválido: ${parte}`)
                    return null
                }
                novos.push({ tipo: "email", valor: email })
            }
        }

        const lista = [...contatos]
        for (const novo of novos) {
            if (!lista.some((c) => c.tipo === novo.tipo && c.valor === novo.valor)) lista.push(novo)
        }
        if (lista.length > MAX_DESTINATARIOS) {
            setErroEntrada(`Máximo de ${MAX_DESTINATARIOS} destinatários por envio.`)
            return null
        }
        setContatos(lista)
        setEntrada("")
        setErroEntrada(null)
        return lista
    }

    const concluido = resultados !== null && resultados.some((r) => r.tipo !== "error")
    const whatsappConectado = whatsapp?.situacao === "CONECTADO"
    const listaVazia = ativos !== null && ativos.emails.length === 0 && ativos.telefones.length === 0
    const canaisEscolhidos = (Object.keys(canais) as RelatorioEnvioCanal[]).filter((c) => canais[c])
    const listaTemDestino =
        ativos !== null &&
        ((canais.EMAIL && ativos.emails.length > 0) || (canais.WHATSAPP && ativos.telefones.length > 0))
    const podeEnviar = !enviando && !concluido && (modo === "lista" ? listaTemDestino : contatos.length > 0 || entrada.trim().length > 0)

    async function enviar() {
        let destinatarios: string[] | undefined
        let telefones: string[] | undefined
        let canaisEnvio: RelatorioEnvioCanal[] | undefined

        if (modo === "outros") {
            const lista = entrada.trim() ? adicionarContatos(entrada) : contatos
            if (!lista || lista.length === 0) return
            const emails = lista.filter((c) => c.tipo === "email").map((c) => c.valor)
            const numeros = lista.filter((c) => c.tipo === "telefone").map((c) => c.valor)
            destinatarios = emails.length > 0 ? emails : undefined
            telefones = numeros.length > 0 ? numeros : undefined
        } else {
            canaisEnvio = canaisEscolhidos
        }

        setEnviando(true)
        setResultados(null)
        try {
            const envios = await enviarRelatorio({ ...periodo, destinatarios, telefones, canais: canaisEnvio })
            setResultados(envios.length > 0 ? envios.map(descreverEnvio) : [{ tipo: "error", mensagem: "Nenhum envio foi iniciado." }])
        } catch (error) {
            const incerto = error instanceof ApiError && [0, 502, 503, 504].includes(error.status)
            setResultados([
                incerto
                    ? {
                        tipo: "warning",
                        mensagem: "Não foi possível confirmar o envio (tempo esgotado ou servidor indisponível). Confira a aba Histórico antes de enviar novamente.",
                    }
                    : { tipo: "error", mensagem: mensagemDeErro(error) },
            ])
        } finally {
            setEnviando(false)
            onEnviado?.()
        }
    }

    const travado = enviando || concluido

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
                                {
                                    valor: "lista",
                                    titulo: "Lista configurada",
                                    icone: List,
                                    detalhe: ativos === null
                                        ? "Carregando..."
                                        : `${plural(ativos.emails.length, "e-mail", "e-mails")} · ${plural(ativos.telefones.length, "número", "números")}`,
                                },
                                { valor: "outros", titulo: "Outros contatos", icone: Mail, detalhe: "E-mails ou telefones avulsos" },
                            ] as const
                        ).map((opcao) => (
                            <button
                                key={opcao.valor}
                                type="button"
                                role="radio"
                                aria-checked={modo === opcao.valor}
                                disabled={travado}
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
                                Nenhum destinatário ativo. Cadastre contatos na aba <strong>Destinatários</strong> ou use “Outros contatos”.
                            </FeedbackBanner>
                        ) : (
                            ativos && (
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <Label>Canais</Label>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            <label className={cn("flex items-start gap-2 rounded-lg border p-3 text-sm", ativos.emails.length === 0 && "opacity-60")}>
                                                <Checkbox
                                                    checked={canais.EMAIL}
                                                    disabled={travado || ativos.emails.length === 0}
                                                    onCheckedChange={(v) => setCanais((c) => ({ ...c, EMAIL: v === true }))}
                                                    className="mt-0.5"
                                                />
                                                <span>
                                                    <span className="flex items-center gap-1.5 font-medium"><Mail className="h-4 w-4" /> E-mail</span>
                                                    <span className="block text-xs text-muted-foreground">{plural(ativos.emails.length, "destinatário ativo", "destinatários ativos")}</span>
                                                </span>
                                            </label>
                                            <label className={cn("flex items-start gap-2 rounded-lg border p-3 text-sm", ativos.telefones.length === 0 && "opacity-60")}>
                                                <Checkbox
                                                    checked={canais.WHATSAPP}
                                                    disabled={travado || ativos.telefones.length === 0}
                                                    onCheckedChange={(v) => setCanais((c) => ({ ...c, WHATSAPP: v === true }))}
                                                    className="mt-0.5"
                                                />
                                                <span>
                                                    <span className="flex items-center gap-1.5 font-medium"><MessageCircle className="h-4 w-4" /> WhatsApp</span>
                                                    <span className="block text-xs text-muted-foreground">
                                                        {plural(ativos.telefones.length, "número ativo", "números ativos")} · {whatsappConectado ? "conectado" : "desconectado"}
                                                    </span>
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                    {canais.WHATSAPP && !whatsappConectado && (
                                        <FeedbackBanner variant="warning">
                                            O WhatsApp não está conectado: o envio por esse canal vai falhar. Conecte o número na aba <strong>WhatsApp</strong>.
                                        </FeedbackBanner>
                                    )}
                                    {canais.EMAIL && ativos.emails.length > 0 && (
                                        <p className="text-xs text-muted-foreground break-words">E-mail para: {ativos.emails.join(", ")}</p>
                                    )}
                                    {canais.WHATSAPP && ativos.telefones.length > 0 && (
                                        <p className="text-xs text-muted-foreground break-words">WhatsApp para: {ativos.telefones.map(formatarTelefoneBR).join(", ")}</p>
                                    )}
                                </div>
                            )
                        )
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor="relatorio-contatos">E-mails ou telefones</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="relatorio-contatos"
                                    value={entrada}
                                    disabled={travado}
                                    onChange={(e) => {
                                        setEntrada(e.target.value)
                                        setErroEntrada(null)
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === "," || e.key === ";") {
                                            e.preventDefault()
                                            adicionarContatos(entrada)
                                        }
                                    }}
                                    onPaste={(e) => {
                                        const colado = e.clipboardData.getData("text")
                                        if (/[,;\n]/.test(colado.trim())) {
                                            e.preventDefault()
                                            adicionarContatos(colado)
                                        }
                                    }}
                                    placeholder="nome@empresa.com.br ou 11 99999-8888"
                                    autoComplete="off"
                                />
                                <Button type="button" variant="outline" disabled={travado} onClick={() => adicionarContatos(entrada)} aria-label="Adicionar contato">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            {erroEntrada && <p className="text-xs text-destructive">{erroEntrada}</p>}
                            {contatos.some((c) => c.tipo === "telefone") && !whatsappConectado && (
                                <p className="text-xs text-amber-700">O WhatsApp não está conectado: os telefones não receberão.</p>
                            )}
                            {contatos.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {contatos.map((contato) => (
                                        <Badge key={`${contato.tipo}:${contato.valor}`} variant="secondary" className="gap-1 text-xs">
                                            {contato.tipo === "email" ? <Mail className="h-3 w-3" /> : <MessageCircle className="h-3 w-3" />}
                                            {contato.tipo === "email" ? contato.valor : formatarTelefoneBR(contato.valor)}
                                            <button
                                                type="button"
                                                disabled={travado}
                                                onClick={() => setContatos((lista) => lista.filter((c) => c !== contato))}
                                                className="hover:text-destructive"
                                                aria-label={`Remover ${contato.valor}`}
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {resultados?.map((resultado, indice) => (
                        <FeedbackBanner key={indice} variant={resultado.tipo}>{resultado.mensagem}</FeedbackBanner>
                    ))}
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
