import { ArrowDownRight, ArrowUpRight, CheckCircle, Clock, Hourglass, Inbox, PackageX, Percent, Repeat, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MetricCard, type MetricCardDelta } from "@/components/dashboard/metric-card"
import { ProcedenteByLabChart, ProcedenteChart, SatsMonthlyChart } from "@/components/dashboard/dashboard-charts"
import { BarListCard } from "@/components/relatorio/bar-list-card"
import { RelatorioSatsTable } from "@/components/relatorio/relatorio-sats-table"
import { descreverPeriodo } from "@/lib/relatorio-periodo"
import { cn } from "@/lib/utils"
import type { RelatorioComparacao, RelatorioDados, RelatorioIndicadores } from "@/types"

const tomAvaliacao: Record<RelatorioComparacao["avaliacao"], string> = {
    POSITIVA: "text-emerald-600",
    NEGATIVA: "text-red-600",
    NEUTRA: "text-muted-foreground",
}

function VariacaoTexto({ comparacao }: { comparacao: RelatorioComparacao }) {
    const Icone = comparacao.situacao === "ALTA" || comparacao.situacao === "NOVO"
        ? ArrowUpRight
        : comparacao.situacao === "QUEDA"
            ? ArrowDownRight
            : null
    return (
        <span className={cn("inline-flex items-center justify-end gap-0.5 font-semibold", tomAvaliacao[comparacao.avaliacao])}>
            {Icone && <Icone className="h-3.5 w-3.5" />}
            {comparacao.texto}
        </span>
    )
}

export function RelatorioVisaoGeral({ dados }: { dados: RelatorioDados }) {
    const { indicadores, periodo, periodoAnterior } = dados
    const comparacoes = new Map(dados.comparacao.map((c) => [c.chave, c]))

    const texto = (chave: keyof RelatorioIndicadores) => comparacoes.get(chave)?.atualTexto ?? "—"
    const delta = (chave: keyof RelatorioIndicadores): MetricCardDelta | null => {
        const c = comparacoes.get(chave)
        if (!c || dados.periodoAnteriorSemDados) return null
        return { texto: c.texto, situacao: c.situacao, avaliacao: c.avaliacao, referencia: `Anterior: ${c.anteriorTexto}` }
    }

    const decididas = indicadores.procedentes + indicadores.improcedentes

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                {dados.periodoAnteriorSemDados
                    ? `Sem SATs no período anterior (${periodoAnterior.rotulo}) — variações não se aplicam.`
                    : `Variações em relação a ${descreverPeriodo(periodoAnterior.inicio, periodoAnterior.fim)}.`}
            </p>

            {/* Indicadores gerais */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Total de SATs" value={texto("totalSats")} description="Abertas no período" icon={Inbox} color="text-blue-500" delta={delta("totalSats")} />
                <MetricCard title="Finalizadas" value={texto("finalizadas")} description="SATs concluídas" icon={CheckCircle} color="text-emerald-500" delta={delta("finalizadas")} />
                <MetricCard title="Em Aberto" value={indicadores.emAberto.toLocaleString("pt-BR")} description="Ainda não finalizadas" icon={Hourglass} color="text-orange-500" />
                <MetricCard
                    title="Taxa de Procedência"
                    value={texto("taxaProcedencia")}
                    description={`${indicadores.procedentes} procedentes de ${decididas} decididas`}
                    icon={Percent}
                    color="text-rose-500"
                    delta={delta("taxaProcedencia")}
                />
                <MetricCard title="SATs Procedentes" value={texto("procedentes")} description="Reclamações procedentes" icon={ShieldCheck} color="text-amber-500" delta={delta("procedentes")} />
                <MetricCard
                    title="Tempo Médio de Resolução"
                    value={texto("tempoMedioDias")}
                    description={`Abertura até AVT concluída (${indicadores.baseTempoMedio} SATs)`}
                    icon={Clock}
                    color="text-sky-500"
                    delta={delta("tempoMedioDias")}
                />
                <MetricCard title="Trocas" value={texto("trocas")} description="Definidas em AVTs concluídas" icon={Repeat} color="text-violet-500" delta={delta("trocas")} />
                <MetricCard title="Recolhimentos de Lote" value={texto("recolhimentos")} description="Definidos em AVTs concluídas" icon={PackageX} color="text-red-500" delta={delta("recolhimentos")} />
            </div>

            {/* Comparativo + procedência */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Comparativo com o período anterior</CardTitle>
                        <CardDescription>
                            {periodo.rotulo} × {periodoAnterior.rotulo} (mesma duração). Considera a situação atual das SATs
                            dos dois períodos — o anterior teve mais tempo para concluir AVTs.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {dados.periodoAnteriorSemDados ? (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                Sem SATs no período anterior — variações não se aplicam.
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Indicador</TableHead>
                                        <TableHead className="text-right">{periodo.rotulo}</TableHead>
                                        <TableHead className="text-right">{periodoAnterior.rotulo}</TableHead>
                                        <TableHead className="text-right">Variação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dados.comparacao.map((c) => (
                                        <TableRow key={c.chave}>
                                            <TableCell>{c.titulo}</TableCell>
                                            <TableCell className="text-right tabular-nums">{c.atualTexto}</TableCell>
                                            <TableCell className="text-right tabular-nums text-muted-foreground">{c.anteriorTexto}</TableCell>
                                            <TableCell className="text-right tabular-nums"><VariacaoTexto comparacao={c} /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
                <div className="lg:col-span-3">
                    <ProcedenteChart data={dados.procedencia} />
                </div>
            </div>

            {/* Distribuição */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <BarListCard title="Por Status" description="Situação atual das SATs do período" data={dados.porStatus} total={indicadores.totalSats} emptyMessage="Nenhuma SAT no período" />
                <BarListCard title="Por Laboratório" description="Destino das SATs do período" data={dados.porLaboratorio} total={indicadores.totalSats} emptyMessage="Nenhuma SAT no período" />
                <ProcedenteByLabChart data={dados.procedenciaPorLaboratorio} />
            </div>

            {/* Rankings */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <BarListCard title="Top 10 Representantes" data={dados.topRepresentantes} total={indicadores.totalSats} ranking emptyMessage="Nenhuma SAT no período" />
                <BarListCard title="Top 10 Produtos" data={dados.topProdutos} total={indicadores.totalSats} ranking emptyMessage="Nenhuma SAT no período" />
                <BarListCard
                    title="Lotes Reincidentes"
                    description="Lotes com mais de uma SAT no período"
                    data={dados.lotesReincidentes}
                    total={indicadores.totalSats}
                    ranking
                    emptyMessage="Nenhum lote reincidente no período"
                />
            </div>

            {dados.evolucaoMensal.length > 1 && <SatsMonthlyChart data={dados.evolucaoMensal} />}

            <RelatorioSatsTable sats={dados.sats} />
        </div>
    )
}
