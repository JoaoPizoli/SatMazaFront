import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { DashboardChartData } from "@/types"

/** Lista com barras horizontais (quantidade e % do total) — mesmo formato do e-mail e do PDF. */
export function BarListCard({
    title,
    description,
    data,
    total,
    ranking = false,
    emptyMessage = "Sem dados no período",
}: {
    title: string
    description?: string
    data: DashboardChartData[]
    /** Base do percentual (padrão: soma dos itens) */
    total?: number
    ranking?: boolean
    emptyMessage?: string
}) {
    const base = total ?? data.reduce((soma, item) => soma + item.value, 0)

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                {data.length === 0 || base === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
                ) : (
                    <ul className="space-y-3">
                        {data.map((item, indice) => {
                            const percentual = base > 0 ? (item.value / base) * 100 : 0
                            return (
                                <li key={`${indice}-${item.name}`} className="space-y-1">
                                    <div className="flex items-baseline justify-between gap-3 text-sm">
                                        <span className="truncate" title={item.name}>
                                            {ranking && <span className="text-muted-foreground">{indice + 1}. </span>}
                                            {item.name}
                                        </span>
                                        <span className="shrink-0 tabular-nums text-muted-foreground">
                                            <span className="font-medium text-foreground">{item.value.toLocaleString("pt-BR")}</span>
                                            {" · "}
                                            {percentual.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                                        </span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                                        <div className="h-full rounded-full bg-primary" style={{ width: `${percentual}%` }} />
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </CardContent>
        </Card>
    )
}
