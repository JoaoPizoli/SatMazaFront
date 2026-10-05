"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatarDataCurtaBR } from "@/lib/relatorio-periodo"
import { cn } from "@/lib/utils"
import { SATStatus, type RelatorioProcedencia, type RelatorioSatItem } from "@/types"

// Mesmas cores de status da listagem de SATs (sat-list-table.tsx)
const statusVariants: Record<SATStatus, "default" | "secondary" | "destructive" | "outline"> = {
    [SATStatus.PENDENTE]: "destructive",
    [SATStatus.ENVIADO_BAGUA]: "default",
    [SATStatus.ENVIADO_BSOLVENTE]: "default",
    [SATStatus.EM_ANALISE]: "secondary",
    [SATStatus.FINALIZADA]: "outline",
}

// Mesmas cores do gráfico de procedência da tela Indicadores
const procedenciaClasses: Record<RelatorioProcedencia, string> = {
    Procedente: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Improcedente: "border-red-200 bg-red-50 text-red-700",
    Pendente: "border-slate-200 bg-slate-50 text-slate-600",
}

const normalizar = (texto: string) =>
    texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

export function RelatorioSatsTable({ sats }: { sats: RelatorioSatItem[] }) {
    const [busca, setBusca] = useState("")

    const filtradas = useMemo(() => {
        const termo = normalizar(busca.trim())
        if (!termo) return sats
        return sats.filter((sat) =>
            normalizar([sat.codigo, sat.cliente, sat.cidade, sat.produto, sat.representante, sat.lotes].join(" ")).includes(termo),
        )
    }, [sats, busca])

    return (
        // contain:inline-size — a largura natural da tabela não alarga a página; ela rola dentro do card
        <Card className="[contain:inline-size]">
            <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1.5">
                    <CardTitle>SATs do período</CardTitle>
                    <CardDescription>
                        {sats.length.toLocaleString("pt-BR")} {sats.length === 1 ? "SAT aberta" : "SATs abertas"} — a mesma lista vai no PDF anexo
                    </CardDescription>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar código, cliente, produto..."
                        className="pl-8"
                    />
                </div>
            </CardHeader>
            <CardContent>
                {/* Um único contêiner de rolagem (vertical e horizontal) mantém o cabeçalho fixo */}
                <div className="max-h-[480px] overflow-auto rounded-md border">
                    <table className="w-full caption-bottom text-sm">
                        <TableHeader className="sticky top-0 z-10 bg-background">
                            <TableRow>
                                <TableHead>Código</TableHead>
                                <TableHead>Abertura</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead className="hidden lg:table-cell">Cidade</TableHead>
                                <TableHead>Produto</TableHead>
                                <TableHead className="hidden xl:table-cell">Representante</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="hidden md:table-cell">Laboratório</TableHead>
                                <TableHead>Procedência</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtradas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                        {sats.length === 0 ? "Nenhuma SAT aberta no período." : "Nenhuma SAT encontrada para a busca."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtradas.map((sat) => {
                                    const marcacoes = [sat.troca && "Troca", sat.recolhimento && "Recolhimento"].filter(Boolean).join(" · ")
                                    return (
                                        <TableRow key={sat.id}>
                                            <TableCell className="font-medium whitespace-nowrap">{sat.codigo}</TableCell>
                                            <TableCell className="whitespace-nowrap">{formatarDataCurtaBR(sat.abertura)}</TableCell>
                                            <TableCell className="max-w-[220px] truncate" title={sat.cliente}>{sat.cliente}</TableCell>
                                            <TableCell className="hidden lg:table-cell whitespace-nowrap">{sat.cidade}</TableCell>
                                            <TableCell className="max-w-[220px] truncate" title={`${sat.produto} · ${sat.lotes}`}>
                                                {sat.produto}
                                                <span className="block text-xs text-muted-foreground">
                                                    Qtd {sat.quantidade} · {sat.lotes}
                                                </span>
                                            </TableCell>
                                            <TableCell className="hidden xl:table-cell whitespace-nowrap">{sat.representante}</TableCell>
                                            <TableCell>
                                                <Badge variant={statusVariants[sat.status] ?? "outline"} className="whitespace-nowrap">
                                                    {sat.statusTexto}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell whitespace-nowrap">{sat.laboratorio ?? "—"}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn("whitespace-nowrap", procedenciaClasses[sat.procedencia])}>
                                                    {sat.procedencia}
                                                </Badge>
                                                {marcacoes && <span className="mt-1 block text-xs text-muted-foreground">{marcacoes}</span>}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
