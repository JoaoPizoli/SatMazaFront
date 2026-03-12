"use client"

import { useState, useEffect, useCallback } from "react"
import { PageTemplate } from "@/components/page-template"
import {
    SatsBySectorChart,
    SatsByRepresentativeChart,
    TopProductsChart,
    ProcedenteChart,
    ProcedenteByLabChart,
} from "@/components/dashboard/dashboard-charts"
import {
    getSatsBySector,
    getSatsByRepresentative,
    getTopProducts,
    getSatsStatusStats,
    getSatsByProcedente,
    getProcedenteByLab,
} from "@/lib/api/sat"
import type { DashboardChartData, DashboardFilter, ErpProduto, ProcedenteByLabData } from "@/types"
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
import { Loader2, X, Inbox, TrendingUp, Users, CheckCircle, ShieldCheck, Search } from "lucide-react"
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
    value: number
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
    const [sectorData, setSectorData] = useState<DashboardChartData[]>([])
    const [repData, setRepData] = useState<DashboardChartData[]>([])
    const [productData, setProductData] = useState<DashboardChartData[]>([])
    const [statusData, setStatusData] = useState<DashboardChartData[]>([])
    const [procedenteData, setProcedenteData] = useState<DashboardChartData[]>([])
    const [procedenteByLabData, setProcedenteByLabData] = useState<ProcedenteByLabData[]>([])

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

            const [sectorRes, repRes, prodRes, statusRes, procedenteRes, procedenteLabRes] =
                await Promise.all([
                    getSatsBySector(filter),
                    getSatsByRepresentative(filter),
                    getTopProducts(filter),
                    getSatsStatusStats(filter),
                    getSatsByProcedente(filter),
                    getProcedenteByLab(filter),
                ])

            setSectorData(sectorRes)
            setRepData(repRes)
            setProductData(prodRes)
            setStatusData(statusRes)
            setProcedenteData(procedenteRes)
            setProcedenteByLabData(procedenteLabRes)
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
    const totalSats = sectorData.reduce((acc, curr) => acc + curr.value, 0)
    const topSectorObj = sectorData.length > 0
        ? sectorData.reduce((prev, current) => (prev.value > current.value ? prev : current))
        : null
    const topRep = repData.length > 0 ? repData[0].name : "N/A"
    const topRepValue = repData.length > 0 ? repData[0].value : 0
    const totalFinalizadas = statusData.find(s => s.name === "FINALIZADA")?.value || 0
    const totalProcedentes = procedenteData.find(s => s.name === "Procedente")?.value || 0

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
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
                        <MetricCard
                            title="Total de SATs"
                            value={totalSats}
                            description="No período selecionado"
                            icon={Inbox}
                            color="text-blue-500"
                        />
                        <MetricCard
                            title="Setor Principal"
                            value={topSectorObj?.value ?? 0}
                            description={topSectorObj?.name ?? "N/A"}
                            icon={TrendingUp}
                            color="text-green-500"
                        />
                        <MetricCard
                            title="Top Representante"
                            value={topRepValue}
                            description={topRep}
                            icon={Users}
                            color="text-purple-500"
                        />
                        <MetricCard
                            title="Total Finalizadas"
                            value={totalFinalizadas}
                            description="SATs concluídas"
                            icon={CheckCircle}
                            color="text-emerald-500"
                        />
                        <MetricCard
                            title="SATs Procedentes"
                            value={totalProcedentes}
                            description="Reclamações procedentes"
                            icon={ShieldCheck}
                            color="text-amber-500"
                        />
                    </div>

                    {/* Gráficos — Linha 1 */}
                    <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
                        <div className="lg:col-span-4">
                            <SatsByRepresentativeChart data={repData} />
                        </div>
                        <div className="lg:col-span-3">
                            <SatsBySectorChart data={sectorData} />
                        </div>
                    </div>

                    {/* Gráficos — Linha 2 */}
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
