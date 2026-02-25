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
    getSatsStatusStats,
} from "@/lib/api/sat"
import { getRepresentantes } from "@/lib/api/usuario"
import { DashboardChartData, DashboardFilter, User, ErpProduto } from "@/types"
import { Input } from "@/components/ui/input"
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Search, X, Inbox, TrendingUp, Users, Package, CheckCircle } from "lucide-react"
import { RepresentativeSearchSelect } from "@/components/representative-search-select"
import { ProductSearchSelect } from "@/components/product-search-select"

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
    const [statusData, setStatusData] = useState<DashboardChartData[]>([]) // Added statusData state
    const [representantes, setRepresentantes] = useState<User[]>([])

    // Filtros
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")

    // Novos estados para filtros de busca
    const [selectedRep, setSelectedRep] = useState<{ CODREP: string; NOMREP: string } | null>(null)
    const [selectedProduct, setSelectedProduct] = useState<ErpProduto | null>(null)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const filter: DashboardFilter = {
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                representanteCodigo: selectedRep?.CODREP, // Usa o código do representante selecionado
                produto: selectedProduct?.DESCRICAO_ITEM, // Usa a descrição do produto selecionado
            }

            const [sectorRes, repRes, prodRes, statusRes] = await Promise.all([ // Added statusRes
                getSatsBySector(filter),
                getSatsByRepresentative(filter),
                getTopProducts(filter),
                getSatsStatusStats(filter), // Added getSatsByStatus call
            ])

            setSectorData(sectorRes)
            setRepData(repRes)
            setProductData(prodRes)
            setStatusData(statusRes) // Set statusData
        } catch (error) {
            console.error("Erro ao buscar dados do dashboard:", error)
        } finally {
            setLoading(false)
        }
    }, [startDate, endDate, selectedRep, selectedProduct])

    // Carregar lista de representantes apenas uma vez (mantido para compatibilidade se necessário, mas não usado no novo select)
    useEffect(() => {
        // getRepresentantes().then(setRepresentantes).catch(...) 
        // Não é mais necessário carregar todos de uma vez
    }, [])

    // Carregar dados do dashboard quando filtros mudarem
    useEffect(() => {
        fetchData()
    }, [fetchData])

    const clearFilters = () => {
        setStartDate("")
        setEndDate("")
        setSelectedRep(null)
        setSelectedProduct(null)
    }

    // KPIs Calculations
    const totalSats = sectorData.reduce((acc, curr) => acc + curr.value, 0)

    // Fix: Find the sector object with the highest value
    const topSectorObj = sectorData.length > 0 ? sectorData.reduce((prev, current) => (prev.value > current.value) ? prev : current) : null
    const topSectorName = topSectorObj ? topSectorObj.name : "N/A"
    const topSectorValue = topSectorObj ? topSectorObj.value : 0

    const topRep = repData.length > 0 ? repData[0].name : "N/A"
    const topRepValue = repData.length > 0 ? repData[0].value : 0

    // Calculate Total Finalizadas from statusData
    const totalFinalizadas = statusData.find(s => s.name === 'FINALIZADA')?.value || 0

    return (
        <PageTemplate
            title="Dashboard Gerencial"
            description="Visão geral e indicadores de performance"
        >
            <div className="flex flex-col space-y-6">
                {/* Filtros */}
                <Card className="border-t-4 border-t-primary">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            Filtros
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 items-end">
                            <div className="space-y-2">
                                <Label>Data Inicial</Label>
                                <DateInput
                                    value={startDate}
                                    onChange={setStartDate}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Data Final</Label>
                                <DateInput
                                    value={endDate}
                                    onChange={setEndDate}
                                />
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
                            <Button variant="outline" onClick={clearFilters} className="w-full">
                                <X className="mr-2 h-4 w-4" />
                                Limpar
                            </Button>
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
                                value={topSectorValue}
                                description={topSectorName}
                                icon={TrendingUp}
                                colorClass="text-green-600"
                                bgClass="bg-green-100 dark:bg-green-900/30"
                            />
                            <KpiCard
                                title="Top Representante"
                                value={topRepValue}
                                description={topRep}
                                icon={Users}
                                colorClass="text-purple-600"
                                bgClass="bg-purple-100 dark:bg-purple-900/30"
                            />
                            <KpiCard
                                title="Total Finalizadas"
                                value={totalFinalizadas}
                                description="SATs concluídas"
                                icon={CheckCircle}
                                colorClass="text-emerald-600"
                                bgClass="bg-emerald-100 dark:bg-emerald-900/30"
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
