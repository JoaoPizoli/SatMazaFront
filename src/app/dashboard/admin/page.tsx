"use client"

import { useState, useEffect, useCallback } from "react"
import { PageTemplate } from "@/components/page-template"
import {
    SatsByRepresentativeChart,
    TopProductsChart,
    ProcedenteChart,
    ProcedenteByLabChart,
    SatsMonthlyChart,
    AgingChart,
    LotesReincidentesChart,
} from "@/components/dashboard/dashboard-charts"
import {
    getSatsByRepresentative,
    getTopProducts,
    getSatsStatusStats,
    getSatsByProcedente,
    getProcedenteByLab,
    getSatsMonthly,
    getResolutionTime,
    getAgingBacklog,
    getTrocasRecolhimentos,
    getLotesReincidentes,
} from "@/lib/api/sat"
import type {
    DashboardChartData,
    DashboardFilter,
    ErpProduto,
    MonthlySatData,
    ProcedenteByLabData,
    ResolutionTimeData,
    TrocasRecolhimentosData,
} from "@/types"
import { DateInput } from "@/components/ui/date-input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, X, Inbox, CheckCircle, ShieldCheck, Search, Percent, Clock, Repeat, PackageX } from "lucide-react"
import { RepresentativeSearchSelect } from "@/components/representative-search-select"
import { ProductSearchSelect } from "@/components/product-search-select"

function MetricCard({
    title,
    value,
    description,
    icon: Icon,
    color,
}: {
    title: string
    value: number | string
    description: string
    icon: React.ComponentType<{ className?: string }>
    color: string
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className={`h-5 w-5 ${color}`} />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </CardContent>
        </Card>
    )
}

export default function AdminDashboardPage() {
    const [loading, setLoading] = useState(true)
    const [repData, setRepData] = useState<DashboardChartData[]>([])
    const [productData, setProductData] = useState<DashboardChartData[]>([])
    const [statusData, setStatusData] = useState<DashboardChartData[]>([])
    const [procedenteData, setProcedenteData] = useState<DashboardChartData[]>([])
    const [procedenteByLabData, setProcedenteByLabData] = useState<ProcedenteByLabData[]>([])
    const [monthlyData, setMonthlyData] = useState<MonthlySatData[]>([])
    const [agingData, setAgingData] = useState<DashboardChartData[]>([])
    const [lotesData, setLotesData] = useState<DashboardChartData[]>([])
    const [resolutionData, setResolutionData] = useState<ResolutionTimeData>({ mediaDias: null, total: 0 })
    const [trocasData, setTrocasData] = useState<TrocasRecolhimentosData>({ trocas: 0, recolhimentos: 0 })

    // Filtros
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [selectedRep, setSelectedRep] = useState<{ CODREP: string; NOMREP: string } | null>(null)
    const [selectedProduct, setSelectedProduct] = useState<ErpProduto | null>(null)
    const [procedenteFilter, setProcedenteFilter] = useState<"all" | "true" | "false">("all")

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const filter: DashboardFilter = {
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                representanteCodigo: selectedRep?.CODREP,
                produto: selectedProduct?.DESCRICAO_ITEM,
                procedente: procedenteFilter !== "all" ? procedenteFilter : undefined,
            }

            const [
                repRes,
                prodRes,
                statusRes,
                procedenteRes,
                procedenteLabRes,
                monthlyRes,
                agingRes,
                lotesRes,
                resolutionRes,
                trocasRes,
            ] = await Promise.all([
                getSatsByRepresentative(filter),
                getTopProducts(filter),
                getSatsStatusStats(filter),
                getSatsByProcedente(filter),
                getProcedenteByLab(filter),
                getSatsMonthly(filter),
                getAgingBacklog(filter),
                getLotesReincidentes(filter),
                getResolutionTime(filter),
                getTrocasRecolhimentos(filter),
            ])

            setRepData(repRes)
            setProductData(prodRes)
            setStatusData(statusRes)
            setProcedenteData(procedenteRes)
            setProcedenteByLabData(procedenteLabRes)
            setMonthlyData(monthlyRes)
            setAgingData(agingRes)
            setLotesData(lotesRes)
            setResolutionData(resolutionRes)
            setTrocasData(trocasRes)
        } catch (error) {
            console.error("Erro ao buscar dados do dashboard:", error)
        } finally {
            setLoading(false)
        }
    }, [startDate, endDate, selectedRep, selectedProduct, procedenteFilter])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const clearFilters = useCallback(() => {
        setStartDate("")
        setEndDate("")
        setSelectedRep(null)
        setSelectedProduct(null)
        setProcedenteFilter("all")
    }, [])

    // KPIs
    // Total vem dos dados de procedência, que cobrem todas as SATs do filtro
    const totalSats = procedenteData.reduce((acc, curr) => acc + curr.value, 0)
    const totalFinalizadas = statusData.find(s => s.name === "FINALIZADA")?.value || 0
    const totalProcedentes = procedenteData.find(s => s.name === "Procedente")?.value || 0
    const totalImprocedentes = procedenteData.find(s => s.name === "Improcedente")?.value || 0
    const totalDecididas = totalProcedentes + totalImprocedentes
    const taxaProcedencia = totalDecididas > 0
        ? `${Math.round((totalProcedentes / totalDecididas) * 100)}%`
        : "—"
    const tempoMedio = resolutionData.mediaDias !== null
        ? `${resolutionData.mediaDias.toLocaleString("pt-BR")} dias`
        : "—"

    return (
        <PageTemplate
            title="Dashboard Gerencial"
            description="Visão geral e indicadores de performance"
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
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 items-end">
                        <div className="space-y-2">
                            <Label>Data Inicial</Label>
                            <DateInput value={startDate} onChange={setStartDate} />
                        </div>
                        <div className="space-y-2">
                            <Label>Data Final</Label>
                            <DateInput value={endDate} onChange={setEndDate} />
                        </div>
                        <div className="space-y-2">
                            <Label>Representante</Label>
                            <RepresentativeSearchSelect
                                onSelect={setSelectedRep}
                                onClear={() => setSelectedRep(null)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Produto</Label>
                            <ProductSearchSelect
                                onSelect={setSelectedProduct}
                                onClear={() => setSelectedProduct(null)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Procedência</Label>
                            <Select
                                value={procedenteFilter}
                                onValueChange={(v) => setProcedenteFilter(v as "all" | "true" | "false")}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Todos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="true">Procedente</SelectItem>
                                    <SelectItem value="false">Improcedente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button variant="outline" onClick={clearFilters} className="w-full">
                            <X className="mr-2 h-4 w-4" />
                            Limpar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    {/* KPIs */}
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                        <MetricCard
                            title="Total de SATs"
                            value={totalSats}
                            description="No período selecionado"
                            icon={Inbox}
                            color="text-blue-500"
                        />
                        <MetricCard
                            title="Total Finalizadas"
                            value={totalFinalizadas}
                            description="SATs concluídas"
                            icon={CheckCircle}
                            color="text-emerald-500"
                        />
                        <MetricCard
                            title="Taxa de Procedência"
                            value={taxaProcedencia}
                            description={`${totalProcedentes} procedentes de ${totalDecididas} decididas`}
                            icon={Percent}
                            color="text-rose-500"
                        />
                        <MetricCard
                            title="Tempo Médio de Resolução"
                            value={tempoMedio}
                            description={`Abertura até AVT concluída (${resolutionData.total} SATs)`}
                            icon={Clock}
                            color="text-sky-500"
                        />
                        <MetricCard
                            title="SATs Procedentes"
                            value={totalProcedentes}
                            description="Reclamações procedentes"
                            icon={ShieldCheck}
                            color="text-amber-500"
                        />
                        <MetricCard
                            title="Trocas Realizadas"
                            value={trocasData.trocas}
                            description="Definidas em AVTs concluídas"
                            icon={Repeat}
                            color="text-violet-500"
                        />
                        <MetricCard
                            title="Recolhimentos de Lote"
                            value={trocasData.recolhimentos}
                            description="Definidos em AVTs concluídas"
                            icon={PackageX}
                            color="text-red-500"
                        />
                    </div>

                    {/* Gráficos — Linha 1 */}
                    <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
                        <div className="lg:col-span-4">
                            <SatsMonthlyChart data={monthlyData} />
                        </div>
                        <div className="lg:col-span-3">
                            <AgingChart data={agingData} />
                        </div>
                    </div>

                    {/* Gráficos — Linha 2 */}
                    <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
                        <div className="lg:col-span-4">
                            <SatsByRepresentativeChart data={repData} />
                        </div>
                        <div className="lg:col-span-3">
                            <LotesReincidentesChart data={lotesData} />
                        </div>
                    </div>

                    {/* Gráficos — Linha 3 */}
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        <TopProductsChart data={productData} />
                        <ProcedenteChart data={procedenteData} />
                        <ProcedenteByLabChart data={procedenteByLabData} />
                    </div>
                </>
            )}
        </PageTemplate>
    )
}
