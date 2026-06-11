"use client"

import { useState, useMemo, useCallback } from "react"
import { PageTemplate } from "@/components/page-template"
import { SatListTable } from "@/components/sat-list-table"
import { SatDetailDialog } from "@/components/sat-detail-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useSats } from "@/hooks/use-sats"
import { useAuth } from "@/contexts/auth-context"
import {
  type SAT,
  SATStatus,
  SATDestino,
  UserRole,
} from "@/types"
import { Filter, Loader2, X } from "lucide-react"

function getDestinoByRole(tipo: UserRole): SATDestino | null {
  if (tipo === UserRole.BAGUA) return SATDestino.BASE_AGUA
  if (tipo === UserRole.BSOLVENTE) return SATDestino.BASE_SOLVENTE
  return null
}

function representanteLabel(sat: SAT): string {
  return (
    sat.representante?.nome ??
    sat.representante?.usuario ??
    `Representante ${sat.representante_id}`
  )
}

export default function FinalizadasPage() {
  const { user } = useAuth()
  const [selectedSat, setSelectedSat] = useState<SAT | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [produtoFilter, setProdutoFilter] = useState("TODOS")
  const [representanteFilter, setRepresentanteFilter] = useState("TODOS")
  const [loteFilter, setLoteFilter] = useState("")

  const destino = getDestinoByRole(user?.tipo ?? UserRole.BAGUA)

  const { sats: allSats, isLoading } = useSats(
    destino ? { laboratorio: destino } : { status: SATStatus.FINALIZADA }
  )

  // SATs finalizadas para esta base
  const satsFinalizadas = useMemo(
    () =>
      allSats.filter(
        (s) => s.status === SATStatus.FINALIZADA && (!destino || s.destino === destino)
      ),
    [allSats, destino]
  )

  // Opções de produto (únicas, ordenadas) derivadas das SATs finalizadas
  const produtoOptions = useMemo(() => {
    const set = new Set<string>()
    satsFinalizadas.forEach((s) => {
      if (s.produtos) set.add(s.produtos)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"))
  }, [satsFinalizadas])

  // Opções de representante (únicas, ordenadas) derivadas das SATs finalizadas
  const representanteOptions = useMemo(() => {
    const map = new Map<string, string>()
    satsFinalizadas.forEach((s) => {
      if (s.representante_id) map.set(s.representante_id, representanteLabel(s))
    })
    return Array.from(map, ([id, label]) => ({ id, label })).sort((a, b) =>
      a.label.localeCompare(b.label, "pt-BR")
    )
  }, [satsFinalizadas])

  const satsFiltered = useMemo(() => {
    const loteBusca = loteFilter.trim().toLowerCase()
    return satsFinalizadas.filter((s) => {
      if (produtoFilter !== "TODOS" && s.produtos !== produtoFilter) return false
      if (representanteFilter !== "TODOS" && s.representante_id !== representanteFilter)
        return false
      if (
        loteBusca &&
        !s.lotes.some((l) => l.lote.toLowerCase().includes(loteBusca))
      )
        return false
      return true
    })
  }, [satsFinalizadas, produtoFilter, representanteFilter, loteFilter])

  const hasActiveFilters =
    produtoFilter !== "TODOS" || representanteFilter !== "TODOS" || !!loteFilter.trim()

  const handleSelectSat = useCallback((sat: SAT) => {
    setSelectedSat(sat)
    setDialogOpen(true)
  }, [])

  const handleClearFilters = useCallback(() => {
    setProdutoFilter("TODOS")
    setRepresentanteFilter("TODOS")
    setLoteFilter("")
  }, [])

  if (isLoading) {
    return (
      <PageTemplate title="Finalizadas" description="Carregando...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageTemplate>
    )
  }

  const infoText = hasActiveFilters
    ? `Exibindo ${satsFiltered.length} de ${satsFinalizadas.length} finalizadas`
    : `${satsFinalizadas.length} SATs finalizadas`

  return (
    <PageTemplate
      title="Finalizadas"
      description="SATs com análise técnica concluída"
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

          <Select value={produtoFilter} onValueChange={setProdutoFilter}>
            <SelectTrigger className="h-8 w-[200px] text-xs">
              <SelectValue placeholder="Produto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos os produtos</SelectItem>
              {produtoOptions.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={representanteFilter} onValueChange={setRepresentanteFilter}>
            <SelectTrigger className="h-8 w-[200px] text-xs">
              <SelectValue placeholder="Representante" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos os representantes</SelectItem>
              {representanteOptions.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            value={loteFilter}
            onChange={(e) => setLoteFilter(e.target.value)}
            placeholder="Buscar lote..."
            className="h-8 w-[150px] text-xs"
          />

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={handleClearFilters}
            >
              <X className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          )}

          <span className="ml-auto text-xs text-muted-foreground hidden sm:inline">
            {infoText}
          </span>
        </div>

        {/* Mobile info text */}
        <span className="text-xs text-muted-foreground sm:hidden">{infoText}</span>
      </div>

      <SatListTable
        sats={satsFiltered}
        onSelectSat={handleSelectSat}
        emptyMessage={
          hasActiveFilters
            ? "Nenhuma SAT finalizada encontrada com os filtros aplicados"
            : "Nenhuma SAT finalizada no momento"
        }
      />

      <SatDetailDialog
        sat={selectedSat}
        avt={selectedSat?.avt ?? null}
        mode="visualizar"
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </PageTemplate>
  )
}
