"use client"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { DashboardChartData } from "@/types"
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from "recharts"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

interface SatsBySectorChartProps {
    data: DashboardChartData[]
}

export function SatsBySectorChart({ data }: SatsBySectorChartProps) {
    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>SATs por Setor</CardTitle>
                <CardDescription>Distribuição de SATs por laboratório de destino</CardDescription>
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
                                    labelLine={false}
                                    label={({ name, percent }) =>
                                        `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                                    }
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
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

interface SatsByRepresentativeTableProps {
    data: DashboardChartData[]
}

export function SatsByRepresentativeTable({
    data,
}: SatsByRepresentativeTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>SATs por Representante</CardTitle>
                <CardDescription>Quantidade de SATs abertas por representante</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="max-h-[350px] overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Representante</TableHead>
                                <TableHead className="text-right">Qtd. SATs</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length > 0 ? (
                                data.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell className="text-right">{item.value}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={2}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        Sem dados disponíveis
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}

interface TopProductsTableProps {
    data: DashboardChartData[]
}

export function TopProductsTable({ data }: TopProductsTableProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Top Produtos</CardTitle>
                <CardDescription>Produtos com maior incidência de SATs</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="max-h-[350px] overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produto</TableHead>
                                <TableHead className="text-right">Qtd. SATs</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length > 0 ? (
                                data.map((item, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium truncate max-w-[200px]" title={item.name}>
                                            {item.name}
                                        </TableCell>
                                        <TableCell className="text-right">{item.value}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={2}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        Sem dados disponíveis
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
