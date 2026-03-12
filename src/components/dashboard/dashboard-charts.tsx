"use client"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import type { DashboardChartData, ProcedenteByLabData } from "@/types"
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts"

const COLORS = [
    "#3b82f6", // Blue 500
    "#10b981", // Emerald 500
    "#f59e0b", // Amber 500
    "#ef4444", // Red 500
    "#8b5cf6", // Violet 500
    "#ec4899", // Pink 500
    "#06b6d4", // Cyan 500
]

const BAR_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"]

const PROCEDENTE_COLORS: Record<string, string> = {
    Procedente: "#10b981",
    Improcedente: "#ef4444",
    Pendente: "#94a3b8",
}

const tooltipStyle = {
    contentStyle: {
        backgroundColor: "hsl(var(--card))",
        borderColor: "hsl(var(--border))",
        borderRadius: "8px",
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    },
    itemStyle: { color: "hsl(var(--foreground))" },
}

function EmptyState() {
    return (
        <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Sem dados disponíveis
        </div>
    )
}

interface ChartProps {
    data: DashboardChartData[]
}

export function SatsBySectorChart({ data }: ChartProps) {
    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <CardTitle>SATs por Setor</CardTitle>
                <CardDescription>Distribuição por destino</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
                <div className="h-[280px] w-full">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={55}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.map((_entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            strokeWidth={0}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip {...tooltipStyle} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState />
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export function SatsByRepresentativeChart({ data }: ChartProps) {
    const chartData = data.slice(0, 10)

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Top Representantes</CardTitle>
                <CardDescription>SATs abertas por representante</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={chartData}
                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#e5e7eb" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={100}
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip cursor={{ fill: "transparent" }} {...tooltipStyle} />
                                <Bar dataKey="value" name="SATs" radius={[0, 4, 4, 0]} barSize={28}>
                                    {chartData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState />
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export function TopProductsChart({ data }: ChartProps) {
    const chartData = data.slice(0, 5)

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Top Produtos</CardTitle>
                <CardDescription>Produtos com maior incidência</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[280px] w-full">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 11 }}
                                    tickLine={false}
                                    interval={0}
                                    tickFormatter={(val: string) =>
                                        val.length > 12 ? `${val.substring(0, 10)}…` : val
                                    }
                                />
                                <YAxis hide />
                                <Tooltip cursor={{ fill: "#f3f4f6" }} {...tooltipStyle} />
                                <Bar dataKey="value" name="SATs" radius={[4, 4, 0, 0]} barSize={40}>
                                    {chartData.map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState />
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export function ProcedenteChart({ data }: ChartProps) {
    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <CardTitle>Procedência</CardTitle>
                <CardDescription>SATs procedentes vs improcedentes</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
                <div className="h-[280px] w-full">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={55}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={PROCEDENTE_COLORS[entry.name] ?? COLORS[index % COLORS.length]}
                                            strokeWidth={0}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip {...tooltipStyle} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState />
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export function ProcedenteByLabChart({ data }: { data: ProcedenteByLabData[] }) {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Procedência por Lab</CardTitle>
                <CardDescription>Procedente vs improcedente por laboratório</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[280px] w-full">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={data}
                                margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                />
                                <YAxis hide />
                                <Tooltip cursor={{ fill: "#f3f4f6" }} {...tooltipStyle} />
                                <Legend iconType="circle" />
                                <Bar
                                    dataKey="procedente"
                                    name="Procedente"
                                    fill="#10b981"
                                    radius={[4, 4, 0, 0]}
                                    barSize={32}
                                />
                                <Bar
                                    dataKey="improcedente"
                                    name="Improcedente"
                                    fill="#ef4444"
                                    radius={[4, 4, 0, 0]}
                                    barSize={32}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState />
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
