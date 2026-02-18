"use client"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { DashboardChartData } from "@/types"
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

// Paleta de cores mais vibrante e profissional
const COLORS = [
    "#3b82f6", // Blue 500
    "#10b981", // Emerald 500
    "#f59e0b", // Amber 500
    "#ef4444", // Red 500
    "#8b5cf6", // Violet 500
    "#ec4899", // Pink 500
    "#06b6d4", // Cyan 500
]

const TABLE_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"]

interface ChartProps {
    data: DashboardChartData[]
}

export function SatsBySectorChart({ data }: ChartProps) {
    return (
        <Card className="flex flex-col h-full shadow-md border-t-4 border-t-blue-500">
            <CardHeader>
                <CardTitle>SATs por Setor</CardTitle>
                <CardDescription>Distribuição por destino</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <div className="h-[300px] w-full">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60} // Donut chart looks cleaner
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            strokeWidth={0}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        borderColor: "hsl(var(--border))",
                                        borderRadius: "8px",
                                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                    }}
                                    itemStyle={{ color: "hsl(var(--foreground))" }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            Sem dados disponíveis
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export function SatsByRepresentativeChart({ data }: ChartProps) {
    // Take top 10 for chart clarity
    const chartData = data.slice(0, 10)

    return (
        <Card className="h-full shadow-md border-t-4 border-t-violet-500">
            <CardHeader>
                <CardTitle>Top Representantes</CardTitle>
                <CardDescription>SATs abertas por representante</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={chartData}
                                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={100}
                                    tick={{ fontSize: 12 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    cursor={{ fill: "transparent" }}
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        borderColor: "hsl(var(--border))",
                                        borderRadius: "8px",
                                    }}
                                    itemStyle={{ color: "hsl(var(--foreground))" }}
                                />
                                <Bar dataKey="value" name="SATs" radius={[0, 4, 4, 0]} barSize={32}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={TABLE_COLORS[index % TABLE_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            Sem dados disponíveis
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export function TopProductsChart({ data }: ChartProps) {
    const chartData = data.slice(0, 5) // Top 5 products

    return (
        <Card className="h-full shadow-md border-t-4 border-t-emerald-500">
            <CardHeader>
                <CardTitle>Top Produtos</CardTitle>
                <CardDescription>Produtos com maior incidência</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="name"
                                    tick={{ fontSize: 11 }}
                                    tickLine={false}
                                    interval={0}
                                    tickFormatter={(val) => val.length > 15 ? `${val.substring(0, 12)}...` : val}
                                />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: "#f3f4f6" }}
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        borderColor: "hsl(var(--border))",
                                        borderRadius: "8px",
                                    }}
                                />
                                <Bar dataKey="value" name="SATs" fill="#10b981" radius={[4, 4, 0, 0]} barSize={48}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            Sem dados disponíveis
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
