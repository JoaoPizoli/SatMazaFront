"use client"

import { Inbox } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { type SAT, SATStatus, SATStatusLabels } from "@/types"

// ─── Status Badge ────────────────────────────────────────────────────────────

const statusVariants: Record<
  SATStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  [SATStatus.PENDENTE]: "destructive",
  [SATStatus.ENVIADO_BAGUA]: "default",
  [SATStatus.ENVIADO_BSOLVENTE]: "default",
  [SATStatus.EM_ANALISE]: "secondary",
  [SATStatus.FINALIZADA]: "outline",
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface SatListTableProps {
  sats: SAT[]
  onSelectSat: (sat: SAT) => void
  emptyMessage?: string
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function SatListTable({
  sats,
  onSelectSat,
  emptyMessage = "Nenhuma SAT encontrada",
}: SatListTableProps) {
  if (sats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Inbox className="h-10 w-10 mb-3" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[130px]">Código</TableHead>
            <TableHead>Produto</TableHead>
            <TableHead className="hidden md:table-cell">Cliente</TableHead>
            <TableHead className="hidden lg:table-cell">Lote(s)</TableHead>
            <TableHead className="w-[140px]">Status</TableHead>
            <TableHead className="hidden sm:table-cell w-[110px]">
              Data
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sats.map((sat) => (
            <TableRow
              key={sat.id}
              className="cursor-pointer hover:bg-muted/60 transition-colors"
              onClick={() => onSelectSat(sat)}
            >
              <TableCell className="font-medium">{sat.codigo}</TableCell>
              <TableCell>{sat.produtos}</TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground max-w-[200px] truncate">
                {sat.cliente}
              </TableCell>
              <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">
                {sat.lotes.join(", ")}
              </TableCell>
              <TableCell>
                <Badge
                  variant={statusVariants[sat.status]}
                  className="text-xs whitespace-nowrap"
                >
                  {SATStatusLabels[sat.status]}
                </Badge>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                {new Date(sat.updatedAt).toLocaleDateString("pt-BR")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
