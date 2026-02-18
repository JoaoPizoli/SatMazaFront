"use client"

import { useState, useEffect, useCallback } from "react"
import { PageTemplate } from "@/components/page-template"
import {
    SatsBySectorChart,
    SatsByRepresentativeTable,
    TopProductsTable,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Search, X } from "lucide-react"

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

    // Calcular totais para os Cards de KPI (opcional, pode vir do backend futuramente)
    const totalSats = sectorData.reduce((acc, curr) => acc + curr.value, 0)

    return (
        <PageTemplate
            title="Dashboard Gerencial"
            description="Visão geral das SATs e indicadores de desempenho"
        >
            <div className="space-y-6">
                {/* Filtros */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Filtros</CardTitle>
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
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endDate">Data Final</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="representative">Representante</Label>
                                <Select
                                    value={selectedRepId}
                                    onValueChange={setSelectedRepId}
                                >
                                    <SelectTrigger id="representative">
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
                                />
                            </div>
                            <div>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={clearFilters}
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Limpar Filtros
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        {/* KPIs Rápidos */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        Total de SATs (no período)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{totalSats}</div>
                                </CardContent>
                            </Card>
                            {/* Pode adicionar mais cards aqui */}
                        </div>

                        {/* Gráficos e Tabelas */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                            <div className="col-span-4">
                                <SatsBySectorChart data={sectorData} />
                            </div>
                            <div className="col-span-3">
                                <SatsByRepresentativeTable data={repData} />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-1">
                            <TopProductsTable data={productData} />
                        </div>
                    </>
                )}
            </div>
        </PageTemplate>
    )
}
