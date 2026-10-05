"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Download, Eye, Loader2, MailPlus, RefreshCw, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DateInput } from "@/components/ui/date-input"
import { Label } from "@/components/ui/label"
import { MonthYearInput } from "@/components/ui/month-year-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FeedbackBanner } from "@/components/feedback-banner"
import { RelatorioVisaoGeral } from "@/components/relatorio/relatorio-visao-geral"
import { RelatorioPreviewDialog } from "@/components/relatorio/relatorio-preview-dialog"
import { RelatorioEnviarDialog, type ModoDestinatarios } from "@/components/relatorio/relatorio-enviar-dialog"
import { downloadRelatorioPdf, getRelatorioDados, mensagemDeErro, type PeriodoConsulta } from "@/lib/api/relatorio"
import {
    descreverPeriodo,
    mesAnteriorSaoPaulo,
    mesAtualSaoPaulo,
    periodoDoMes,
    validarPeriodo,
} from "@/lib/relatorio-periodo"
import type { RelatorioDados } from "@/types"

type ModoPeriodo = "mensal" | "personalizado"

export function RelatorioTab({ userEmail, onEnviado }: { userEmail: string | null; onEnviado?: () => void }) {
    const [modo, setModo] = useState<ModoPeriodo>("mensal")
    const [mes, setMes] = useState(() => mesAnteriorSaoPaulo())
    const [inicio, setInicio] = useState(() => periodoDoMes(mesAnteriorSaoPaulo()).inicio)
    const [fim, setFim] = useState(() => periodoDoMes(mesAnteriorSaoPaulo()).fim)

    const [dados, setDados] = useState<RelatorioDados | null>(null)
    const [carregando, setCarregando] = useState(false)
    const [erro, setErro] = useState<string | null>(null)
    const [baixandoPdf, setBaixandoPdf] = useState(false)
    const [erroPdf, setErroPdf] = useState<string | null>(null)
    const [previewAberto, setPreviewAberto] = useState(false)
    const [envio, setEnvio] = useState<{ chave: number; modo: ModoDestinatarios; emails: string[] } | null>(null)
    const ultimaConsulta = useRef(0)

    // Período escolhido na tela (ainda não validado)
    const selecionado = useMemo<{ inicio: string; fim: string } | null>(() => {
        if (modo === "mensal") return mes ? periodoDoMes(mes) : null
        return inicio && fim ? { inicio, fim } : null
    }, [modo, mes, inicio, fim])

    const erroPeriodo = useMemo(() => {
        if (modo === "mensal" && mes > mesAtualSaoPaulo()) return "Escolha um mês até o mês atual."
        if (!selecionado) return modo === "mensal" ? "Informe o mês do relatório." : "Informe a data inicial e a data final."
        return validarPeriodo(selecionado.inicio, selecionado.fim)
    }, [modo, mes, selecionado])

    const periodo: PeriodoConsulta | null = useMemo(
        () => (selecionado && !erroPeriodo ? { startDate: selecionado.inicio, endDate: selecionado.fim } : null),
        [selecionado, erroPeriodo],
    )

    const carregar = useCallback(async () => {
        if (!periodo) return
        const consulta = ++ultimaConsulta.current
        setCarregando(true)
        setErro(null)
        try {
            const resultado = await getRelatorioDados(periodo)
            if (consulta === ultimaConsulta.current) setDados(resultado)
        } catch (error) {
            if (consulta === ultimaConsulta.current) {
                setDados(null)
                setErro(mensagemDeErro(error))
            }
        } finally {
            if (consulta === ultimaConsulta.current) setCarregando(false)
        }
    }, [periodo])

    useEffect(() => {
        carregar()
    }, [carregar])

    async function baixarPdf() {
        if (!periodo) return
        setBaixandoPdf(true)
        setErroPdf(null)
        try {
            await downloadRelatorioPdf(periodo)
        } catch (error) {
            setErroPdf(mensagemDeErro(error))
        } finally {
            setBaixandoPdf(false)
        }
    }

    function abrirEnvio(modoEnvio: ModoDestinatarios) {
        setEnvio({
            chave: Date.now(),
            modo: modoEnvio,
            emails: modoEnvio === "outros" && userEmail ? [userEmail.toLowerCase()] : [],
        })
    }

    function trocarModo(novo: ModoPeriodo) {
        // Ao personalizar, parte do mês que estava selecionado
        if (novo === "personalizado" && selecionado) {
            setInicio(selecionado.inicio)
            setFim(selecionado.fim)
        }
        setModo(novo)
    }

    const acoesDesabilitadas = !periodo || carregando

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Período do relatório</CardTitle>
                    <CardDescription>
                        Considera as SATs abertas no período (horário de Brasília). O envio automático mensal usa sempre o mês anterior completo.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                            <Label>Tipo de período</Label>
                            <Select value={modo} onValueChange={(v) => trocarModo(v as ModoPeriodo)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="mensal">Mensal</SelectItem>
                                    <SelectItem value="personalizado">Personalizado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {modo === "mensal" ? (
                            <div className="space-y-2">
                                <Label>Mês</Label>
                                <MonthYearInput value={mes} onChange={setMes} />
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <Label>Data inicial</Label>
                                    <DateInput value={inicio} onChange={setInicio} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Data final</Label>
                                    <DateInput value={fim} onChange={setFim} />
                                </div>
                            </>
                        )}
                        <Button variant="outline" onClick={carregar} disabled={acoesDesabilitadas} className="w-full sm:w-auto">
                            {carregando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Atualizar
                        </Button>
                    </div>

                    {erroPeriodo ? (
                        <p className="text-sm text-destructive">{erroPeriodo}</p>
                    ) : (
                        selecionado && <p className="text-sm text-muted-foreground">{descreverPeriodo(selecionado.inicio, selecionado.fim)}</p>
                    )}

                    <div className="flex flex-wrap gap-2 border-t pt-4">
                        <Button variant="outline" onClick={() => setPreviewAberto(true)} disabled={acoesDesabilitadas}>
                            <Eye className="mr-2 h-4 w-4" />
                            Pré-visualizar e-mail
                        </Button>
                        <Button variant="outline" onClick={baixarPdf} disabled={acoesDesabilitadas || baixandoPdf}>
                            {baixandoPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            Baixar PDF
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => abrirEnvio("outros")}
                            disabled={acoesDesabilitadas || !userEmail}
                            title={userEmail ? `Envia somente para ${userEmail}` : "Seu usuário não tem e-mail cadastrado"}
                        >
                            <MailPlus className="mr-2 h-4 w-4" />
                            Enviar teste para mim
                        </Button>
                        <Button onClick={() => abrirEnvio("lista")} disabled={acoesDesabilitadas}>
                            <Send className="mr-2 h-4 w-4" />
                            Enviar relatório
                        </Button>
                    </div>
                    {erroPdf && (
                        <FeedbackBanner variant="error" onClose={() => setErroPdf(null)}>
                            {erroPdf}
                        </FeedbackBanner>
                    )}
                </CardContent>
            </Card>

            {erro && <FeedbackBanner variant="error">{erro}</FeedbackBanner>}

            {carregando && !dados ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            ) : (
                dados && !erroPeriodo && (
                    <div className={carregando ? "pointer-events-none opacity-60 transition-opacity" : "transition-opacity"}>
                        <RelatorioVisaoGeral dados={dados} />
                    </div>
                )
            )}

            {previewAberto && periodo && (
                <RelatorioPreviewDialog periodo={periodo} onClose={() => setPreviewAberto(false)} />
            )}

            {envio && periodo && (
                <RelatorioEnviarDialog
                    key={envio.chave}
                    open
                    onOpenChange={(aberto) => !aberto && setEnvio(null)}
                    periodo={periodo}
                    modoInicial={envio.modo}
                    emailsIniciais={envio.emails}
                    onEnviado={onEnviado}
                />
            )}
        </div>
    )
}
