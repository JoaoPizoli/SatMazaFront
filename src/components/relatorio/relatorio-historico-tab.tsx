"use client"

import { useCallback, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { FeedbackBanner } from "@/components/feedback-banner"
import { getHistoricoRelatorio, mensagemDeErro } from "@/lib/api/relatorio"
import { formatarDataHoraBR, rotuloPeriodo } from "@/lib/relatorio-periodo"
import { cn } from "@/lib/utils"
import type { PaginatedResponse, RelatorioEnvio, RelatorioEnvioStatus } from "@/types"

const LIMITE = 20

const STATUS_ENVIO: Record<RelatorioEnvioStatus, { rotulo: string; classe: string }> = {
    SUCESSO: { rotulo: "Enviado", classe: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    FALHA: { rotulo: "Falhou", classe: "border-red-200 bg-red-50 text-red-700" },
    PROCESSANDO: { rotulo: "Enviando", classe: "border-slate-200 bg-slate-50 text-slate-600" },
}

export function StatusEnvioBadge({ status }: { status: RelatorioEnvioStatus }) {
    const { rotulo, classe } = STATUS_ENVIO[status]
    return (
        <Badge variant="outline" className={cn("whitespace-nowrap", classe)}>
            {rotulo}
        </Badge>
    )
}

export function RelatorioHistoricoTab() {
    const [pagina, setPagina] = useState(1)
    const [resultado, setResultado] = useState<PaginatedResponse<RelatorioEnvio> | null>(null)
    const [carregando, setCarregando] = useState(true)
    const [erro, setErro] = useState<string | null>(null)

    const carregar = useCallback(async () => {
        setCarregando(true)
        setErro(null)
        try {
            setResultado(await getHistoricoRelatorio(pagina, LIMITE))
        } catch (error) {
            setErro(mensagemDeErro(error))
        } finally {
            setCarregando(false)
        }
    }, [pagina])

    useEffect(() => {
        carregar()
    }, [carregar])

    const envios = resultado?.data ?? []
    const totalPaginas = resultado?.meta.totalPages ?? 1

    return (
        // contain:inline-size — a tabela rola dentro do card em telas estreitas, sem alargar a página
        <Card className="[contain:inline-size]">
            <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1.5">
                    <CardTitle className="text-lg">Histórico de envios</CardTitle>
                    <CardDescription>Envios manuais e automáticos do relatório, do mais recente para o mais antigo.</CardDescription>
                </div>
                <Button variant="outline" onClick={carregar} disabled={carregando}>
                    {carregando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Atualizar
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {erro && <FeedbackBanner variant="error">{erro}</FeedbackBanner>}
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Origem</TableHead>
                                <TableHead>Período</TableHead>
                                <TableHead className="hidden md:table-cell">Destinatários</TableHead>
                                <TableHead>Situação</TableHead>
                                <TableHead className="hidden lg:table-cell">Enviado por</TableHead>
                                <TableHead className="hidden xl:table-cell text-right">SATs</TableHead>
                                <TableHead className="hidden sm:table-cell">Erro</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {carregando && !resultado ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">Carregando...</TableCell>
                                </TableRow>
                            ) : envios.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                        Nenhum envio registrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                envios.map((envio) => (
                                    <TableRow key={envio.id}>
                                        <TableCell className="whitespace-nowrap">{formatarDataHoraBR(envio.createdAt)}</TableCell>
                                        <TableCell>
                                            <Badge variant={envio.tipo === "AUTOMATICO" ? "secondary" : "outline"}>
                                                {envio.tipo === "AUTOMATICO" ? "Automático" : "Manual"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">{rotuloPeriodo(envio.periodo_inicio, envio.periodo_fim)}</TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="cursor-help underline decoration-dotted underline-offset-4">
                                                        {envio.destinatarios.length} {envio.destinatarios.length === 1 ? "e-mail" : "e-mails"}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-sm break-words">{envio.destinatarios.join(", ")}</TooltipContent>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell><StatusEnvioBadge status={envio.status} /></TableCell>
                                        <TableCell className="hidden lg:table-cell">{envio.enviado_por ?? "Sistema (automático)"}</TableCell>
                                        <TableCell className="hidden xl:table-cell text-right tabular-nums">{envio.total_sats ?? "—"}</TableCell>
                                        <TableCell className="hidden sm:table-cell max-w-[280px]">
                                            {envio.erro ? (
                                                <span className="block truncate text-xs text-destructive" title={envio.erro}>{envio.erro}</span>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {totalPaginas > 1 && (
                    <div className="flex items-center justify-end gap-2 text-sm">
                        <span className="text-muted-foreground">Página {pagina} de {totalPaginas}</span>
                        <Button variant="outline" size="icon" disabled={pagina <= 1 || carregando} onClick={() => setPagina((p) => p - 1)} aria-label="Página anterior">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" disabled={pagina >= totalPaginas || carregando} onClick={() => setPagina((p) => p + 1)} aria-label="Próxima página">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
