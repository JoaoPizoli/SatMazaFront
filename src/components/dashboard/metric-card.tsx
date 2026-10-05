import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { RelatorioVariacaoAvaliacao, RelatorioVariacaoSituacao } from "@/types"

export type MetricCardDelta = {
    /** Variação já formatada: '+12,5%', '-3 p.p.', 'novo', '—' */
    texto: string
    situacao: RelatorioVariacaoSituacao
    avaliacao: RelatorioVariacaoAvaliacao
    /** Ex.: 'Anterior: 40' */
    referencia?: string
}

function MetricDelta({ delta }: { delta: MetricCardDelta }) {
    const Icone =
        delta.situacao === "ALTA" || delta.situacao === "NOVO"
            ? ArrowUpRight
            : delta.situacao === "QUEDA"
                ? ArrowDownRight
                : Minus
    const tom =
        delta.avaliacao === "POSITIVA"
            ? "text-emerald-600 dark:text-emerald-400"
            : delta.avaliacao === "NEGATIVA"
                ? "text-red-600 dark:text-red-400"
                : "text-muted-foreground"

    return (
        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs">
            <span className={cn("inline-flex items-center gap-0.5 font-semibold", tom)}>
                <Icone className="h-3.5 w-3.5" />
                {delta.texto}
            </span>
            {delta.referencia && <span className="text-muted-foreground">{delta.referencia}</span>}
        </div>
    )
}

export function MetricCard({
    title,
    value,
    description,
    icon: Icon,
    color,
    delta,
}: {
    title: string
    value: number | string
    description: string
    icon: React.ComponentType<{ className?: string }>
    color: string
    /** Variação em relação a um período anterior (opcional) */
    delta?: MetricCardDelta | null
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className={`h-5 w-5 ${color}`} />
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold">{value}</div>
                {delta && <MetricDelta delta={delta} />}
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </CardContent>
        </Card>
    )
}
