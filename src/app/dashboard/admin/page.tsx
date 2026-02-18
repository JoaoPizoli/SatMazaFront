"use client"

import { useState, useEffect, useCallback } from "react"
import { PageTemplate } from "@/components/page-template"
import {
    SatsBySectorChart,
    SatsByRepresentativeChart,
    TopProductsChart,
} from "@/components/dashboard/dashboard-charts"
import {
    getSatsBySector,
    getSatsByRepresentative,
    getTopProducts,
} from "@/lib/api/sat"
import { getRepresentantes } from "@/lib/api/usuario"
import { DashboardChartData, DashboardFilter, User } from "@/types"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Search, X, Inbox, TrendingUp, Users, Package } from "lucide-react"

function KpiCard({
    title,
    value,
    description,
    icon: Icon,
    colorClass,
    bgClass,
}: {
    title: string
    value: number
    description: string
    icon: any
    colorClass: string
    bgClass: string
}) {
    return (
        <Card className="shadow-sm border-l-4" style={{ borderLeftColor: 'currentColor' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className={`p-2 rounded-full ${bgClass}`}>
                    <Icon className={`h-4 w-4 ${colorClass}`} />
                </div>
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
    const [representantes, setRepresentantes] = useState<User[]>([])

    // Filtros
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [selectedRepId, setSelectedRepId] = useState<string>("all")
    const [produtoSearch, setProdutoSearch] = useState("")

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const filter: DashboardFilter = {
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                representanteId:
                    selectedRepId && selectedRepId !== "all"
                        ? Number(selectedRepId)
                        : undefined,
                produto: produtoSearch || undefined,
            }

            const [sectorRes, repRes, prodRes] = await Promise.all([
                getSatsBySector(filter),
                getSatsByRepresentative(filter),
                getTopProducts(filter),
            ])

            setSectorData(sectorRes)
            setRepData(repRes)
            setProductData(prodRes)
        } catch (error) {
            console.error("Erro ao buscar dados do dashboard:", error)
        } finally {
            setLoading(false)
        }
    }, [startDate, endDate, selectedRepId, produtoSearch])

    // Carregar lista de representantes apenas uma vez
    useEffect(() => {
        getRepresentantes()
            .then(setRepresentantes)
            .catch((err) => console.error("Erro ao carregar representantes", err))
    }, [])

    // Carregar dados do dashboard quando filtros mudarem
    useEffect(() => {
        fetchData()
    }, [fetchData])

    const clearFilters = () => {
        setStartDate("")
        setEndDate("")
        setSelectedRepId("all")
        setProdutoSearch("")
    }

    const totalSats = sectorData.reduce((acc, curr) => acc + curr.value, 0)
    // Assumindo que o primeiro setor com mais dados é o dominante para KPI rápido
    const topSector = sectorData.length > 0 ? sectorData.reduce((prev, current) => (prev.value > current.value) ? prev : current).name : "N/A"

    const topRep = repData.length > 0 ? repData[0].name : "N/A"

    return (
        <PageTemplate
            title="Dashboard Gerencial"
            description="Visão geral e indicadores de performance"
        >
            <div className="space-y-8">
                {/* Filtros */}
                <Card className="border-t-4 border-t-primary shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Search className="h-4 w-4 bg-primary/10 text-primary p-0.5 rounded" />
                            Filtros Avançados
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5 items-end">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">Data Inicial</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-background"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">Data Final</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-background"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="representative">Representante</Label>
                                <Select
                                    value={selectedRepId}
                                    onValueChange={setSelectedRepId}
                                >
                                    <SelectTrigger id="representative" className="bg-background">
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        {representantes.map((rep) => (
                                            <SelectItem key={rep.id} value={String(rep.id)}>
                                                {rep.usuario}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="produto">Produto</Label>
                                <Input
                                    id="produto"
                                    placeholder="Buscar produto..."
                                    value={produtoSearch}
                                    onChange={(e) => setProdutoSearch(e.target.value)}
                                    className="bg-background"
                                />
                            </div>
                            <div>
                                <Button
                                    variant="secondary"
                                    className="w-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                                    onClick={clearFilters}
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Limpar
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {/* KPIs Coloridos */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <KpiCard
                                title="Total de SATs"
                                value={totalSats}
                                description="No período selecionado"
                                icon={Inbox}
                                colorClass="text-blue-600"
                                bgClass="bg-blue-100 dark:bg-blue-900/30"
                            />
                            <KpiCard
                                title="Setor Principal"
                                value={sectorData.length} // Apenas para placeholder visual, ideal seria o nome
                                description={topSector}
                                icon={TrendingUp}
                                colorClass="text-green-600"
                                bgClass="bg-green-100 dark:bg-green-900/30"
                            />
                            <KpiCard
                                title="Top Representante"
                                value={repData.length > 0 ? repData[0].value : 0}
                                description={topRep}
                                icon={Users}
                                colorClass="text-purple-600"
                                bgClass="bg-purple-100 dark:bg-purple-900/30"
                            />
                            <KpiCard
                                title="Produtos Únicos"
                                value={productData.length}
                                description="Tipos de produtos afetados"
                                icon={Package}
                                colorClass="text-amber-600"
                                bgClass="bg-amber-100 dark:bg-amber-900/30"
                            />
                        </div>

                        {/* Gráficos */}
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                            <div className="col-span-1 md:col-span-2 lg:col-span-4 h-[400px]">
                                <SatsByRepresentativeChart data={repData} />
                            </div>
                            <div className="col-span-1 md:col-span-2 lg:col-span-3 h-[400px]">
                                <SatsBySectorChart data={sectorData} />
                            </div>
                        </div>

                        <div className="grid gap-6 grid-cols-1 h-[400px]">
                            <TopProductsChart data={productData} />
                        </div>
                    </>
                )}
            </div>
        </PageTemplate>
    )
}
