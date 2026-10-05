"use client"

import { useCallback, useEffect, useState } from "react"
import { CalendarClock, Loader2, Save } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { FeedbackBanner } from "@/components/feedback-banner"
import { StatusEnvioBadge } from "@/components/relatorio/relatorio-historico-tab"
import { getConfiguracaoRelatorio, mensagemDeErro, updateConfiguracaoRelatorio } from "@/lib/api/relatorio"
import { formatarDataBR, formatarDataHoraBR, rotuloPeriodo } from "@/lib/relatorio-periodo"
import type { RelatorioConfiguracaoResposta, RelatorioProximoEnvio } from "@/types"

const DIAS = Array.from({ length: 28 }, (_, i) => i + 1)
const HORAS = Array.from({ length: 24 }, (_, i) => i)
const pad2 = (n: number) => String(n).padStart(2, "0")

function textoProximoEnvio(proximo: RelatorioProximoEnvio): string {
    const quando = `${formatarDataBR(proximo.data)} às ${pad2(proximo.hora)}:00`
    if (proximo.situacao === "EM_ANDAMENTO") return `Enviando agora o relatório de ${proximo.periodo.rotulo}.`
    if (proximo.situacao === "RETENTATIVA" && proximo.novaTentativaEm) {
        return `A última tentativa de enviar o relatório de ${proximo.periodo.rotulo} falhou; nova tentativa por volta de ${formatarDataHoraBR(proximo.novaTentativaEm)}.`
    }
    if (proximo.situacao === "PENDENTE") {
        return `O horário de ${quando} já passou: o relatório de ${proximo.periodo.rotulo} será enviado nos próximos minutos.`
    }
    return `${quando} — relatório de ${proximo.periodo.rotulo}.`
}

export function RelatorioAgendamentoTab() {
    const [resposta, setResposta] = useState<RelatorioConfiguracaoResposta | null>(null)
    const [ativo, setAtivo] = useState(false)
    const [dia, setDia] = useState(1)
    const [hora, setHora] = useState(8)
    const [carregando, setCarregando] = useState(true)
    const [salvando, setSalvando] = useState(false)
    const [aviso, setAviso] = useState<{ tipo: "success" | "error"; mensagem: string } | null>(null)

    const aplicar = useCallback((dados: RelatorioConfiguracaoResposta) => {
        setResposta(dados)
        setAtivo(dados.configuracao.envio_automatico_ativo)
        setDia(dados.configuracao.dia_envio)
        setHora(dados.configuracao.hora_envio)
    }, [])

    const carregar = useCallback(async () => {
        setCarregando(true)
        try {
            aplicar(await getConfiguracaoRelatorio())
        } catch (error) {
            setAviso({ tipo: "error", mensagem: mensagemDeErro(error) })
        } finally {
            setCarregando(false)
        }
    }, [aplicar])

    useEffect(() => {
        carregar()
    }, [carregar])

    const configuracao = resposta?.configuracao
    const alterado = !!configuracao && (
        ativo !== configuracao.envio_automatico_ativo || dia !== configuracao.dia_envio || hora !== configuracao.hora_envio
    )

    async function salvar() {
        setSalvando(true)
        setAviso(null)
        try {
            aplicar(await updateConfiguracaoRelatorio({ envio_automatico_ativo: ativo, dia_envio: dia, hora_envio: hora }))
            setAviso({ tipo: "success", mensagem: "Configuração do envio automático salva." })
        } catch (error) {
            setAviso({ tipo: "error", mensagem: mensagemDeErro(error) })
        } finally {
            setSalvando(false)
        }
    }

    if (carregando && !resposta) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        )
    }

    const ultimo = resposta?.ultimoEnvioAutomatico

    return (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle className="text-lg">Envio automático mensal</CardTitle>
                    <CardDescription>
                        Todo mês, no dia e hora escolhidos (horário de Brasília), o relatório do mês anterior completo é enviado aos destinatários ativos.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label htmlFor="envio-automatico" className="text-base">Envio automático</Label>
                            <p className="text-sm text-muted-foreground">{ativo ? "Ligado" : "Desligado"}</p>
                        </div>
                        <Switch id="envio-automatico" checked={ativo} onCheckedChange={setAtivo} disabled={salvando} />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Dia do mês</Label>
                            <Select value={String(dia)} onValueChange={(v) => setDia(Number(v))} disabled={salvando}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DIAS.map((d) => (
                                        <SelectItem key={d} value={String(d)}>Dia {d}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Horário (Brasília)</Label>
                            <Select value={String(hora)} onValueChange={(v) => setHora(Number(v))} disabled={salvando}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {HORAS.map((h) => (
                                        <SelectItem key={h} value={String(h)}>{pad2(h)}:00</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {aviso && (
                        <FeedbackBanner variant={aviso.tipo} onClose={() => setAviso(null)}>
                            {aviso.mensagem}
                        </FeedbackBanner>
                    )}

                    <div className="flex justify-end gap-2">
                        {alterado && (
                            <Button variant="outline" disabled={salvando} onClick={() => resposta && aplicar(resposta)}>
                                Descartar
                            </Button>
                        )}
                        <Button onClick={salvar} disabled={!alterado || salvando}>
                            {salvando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Salvar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <CalendarClock className="h-5 w-5" />
                        Situação
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="space-y-1">
                        <p className="font-medium">Próximo envio</p>
                        <p className="text-muted-foreground">
                            {configuracao?.envio_automatico_ativo && resposta?.proximoEnvio
                                ? textoProximoEnvio(resposta.proximoEnvio)
                                : "Envio automático desligado."}
                        </p>
                        {alterado && <p className="text-xs text-amber-700">Salve para aplicar as alterações.</p>}
                    </div>

                    {configuracao?.envio_automatico_ativo && resposta?.destinatariosAtivos === 0 && (
                        <FeedbackBanner variant="warning">
                            Nenhum destinatário ativo: o envio automático não acontecerá até que um e-mail seja ativado.
                        </FeedbackBanner>
                    )}

                    <div className="space-y-1">
                        <p className="font-medium">Destinatários ativos</p>
                        <p className="text-muted-foreground">{resposta?.destinatariosAtivos ?? 0}</p>
                    </div>

                    <div className="space-y-1">
                        <p className="font-medium">Último envio automático</p>
                        {ultimo ? (
                            <div className="space-y-1 text-muted-foreground">
                                <div className="flex flex-wrap items-center gap-2">
                                    <StatusEnvioBadge status={ultimo.status} />
                                    <span>{formatarDataHoraBR(ultimo.createdAt)}</span>
                                </div>
                                <p>Relatório de {rotuloPeriodo(ultimo.periodo_inicio, ultimo.periodo_fim)}</p>
                                {ultimo.erro && <p className="text-xs text-destructive break-words">{ultimo.erro.slice(0, 300)}</p>}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">Nenhum envio automático ainda.</p>
                        )}
                    </div>

                    <div className="space-y-1 border-t pt-4 text-xs text-muted-foreground">
                        <p className="font-medium text-foreground">Como funciona</p>
                        <ul className="list-disc space-y-1 pl-4">
                            <li>O relatório enviado é sempre o do mês anterior completo.</li>
                            <li>Se o servidor estiver fora do ar no horário, o envio acontece assim que ele voltar (dentro do mesmo mês).</li>
                            <li>Em caso de falha, o sistema tenta de novo até 3 vezes, com pelo menos 1 hora entre as tentativas.</li>
                            <li>
                                Ao ligar, vale a partir do próximo horário agendado — o mês anterior não é enviado retroativamente.
                                Para enviá-lo, use <Badge variant="outline" className="mx-0.5 px-1.5 py-0 text-[11px]">Enviar relatório</Badge> na aba Relatório.
                            </li>
                        </ul>
                        {configuracao?.atualizado_por && (
                            <p className="pt-2">Alterado por {configuracao.atualizado_por} em {formatarDataHoraBR(configuracao.updatedAt)}.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
