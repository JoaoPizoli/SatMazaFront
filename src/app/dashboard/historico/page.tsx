"use client"

import { useState, useMemo, useCallback } from "react"
import { PageTemplate } from "@/components/page-template"
import { SatListTable } from "@/components/sat-list-table"
import { SatDetailDialog } from "@/components/sat-detail-dialog"
import { SatFiltersBar } from "@/components/sat-filters-bar"
import { useSats } from "@/hooks/use-sats"
import { useAuth } from "@/contexts/auth-context"
import {
  type SAT,
  SATStatus,
  SATDestino,
  UserRole,
} from "@/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"

const MAX_RECENT = 10

export default function HistoricoFinalizadasPage() {
  const { user } = useAuth()
  const [selectedSat, setSelectedSat] = useState<SAT | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [labFilter, setLabFilter] = useState<SATDestino | "TODOS">("TODOS")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")

  const isOrquestrador = user?.tipo === UserRole.ORQUESTRADOR || user?.tipo === UserRole.ADMIN

  const { sats: allSats, isLoading } = useSats({ status: SATStatus.FINALIZADA })

  const allFinalizadas = useMemo(() => {
    let sats = allSats

    if (user?.tipo === UserRole.BAGUA) {
      sats = sats.filter((s) => s.destino === SATDestino.BASE_AGUA)
    } else if (user?.tipo === UserRole.BSOLVENTE) {
      sats = sats.filter((s) => s.destino === SATDestino.BASE_SOLVENTE)
    }

    return sats.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() -
        new Date(a.updatedAt).getTime()
    )
  }, [allSats, user?.tipo])

  const satsFiltered = useMemo(() => {
    let filtered = allFinalizadas

    if (labFilter !== "TODOS") {
      filtered = filtered.filter((s) => s.destino === labFilter)
    }
    if (dataInicio) {
      const inicio = new Date(dataInicio)
      filtered = filtered.filter(
        (s) => new Date(s.updatedAt) >= inicio
      )
    }
    if (dataFim) {
      const fim = new Date(dataFim)
      fim.setHours(23, 59, 59, 999)
      filtered = filtered.filter(
        (s) => new Date(s.updatedAt) <= fim
      )
    }
    return filtered
  }, [allFinalizadas, labFilter, dataInicio, dataFim])

  const hasActiveFilters = labFilter !== "TODOS" || !!dataInicio || !!dataFim
  const satsToShow = hasActiveFilters
    ? satsFiltered
    : satsFiltered.slice(0, MAX_RECENT)

  const handleSelectSat = useCallback((sat: SAT) => {
    setSelectedSat(sat)
    setDialogOpen(true)
  }, [])

  const handleClearFilters = useCallback(() => {
    setLabFilter("TODOS")
    setDataInicio("")
    setDataFim("")
  }, [])

  const infoText = hasActiveFilters
    ? `Exibindo ${satsToShow.length} de ${allFinalizadas.length} finalizadas`
    : allFinalizadas.length > MAX_RECENT
      ? `${MAX_RECENT} mais recentes de ${allFinalizadas.length} — filtre para ver mais`
      : `${satsToShow.length} SATs finalizadas`

  if (isLoading) {
    return (
      <PageTemplate title="Finalizadas" description="Carregando...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageTemplate>
    )
  }

  return (
    <PageTemplate
      title="Finalizadas"
      description="SATs com análise técnica concluída"
    >
      <SatFiltersBar
        showLabFilter={isOrquestrador}
        labFilter={labFilter}
        onLabFilterChange={setLabFilter}
        dataInicio={dataInicio}
        onDataInicioChange={setDataInicio}
        dataFim={dataFim}
        onDataFimChange={setDataFim}
        onClear={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        infoText={infoText}
      />

      <ScrollArea className="max-h-[calc(100vh-280px)]">
        <SatListTable
          sats={satsToShow}
          onSelectSat={handleSelectSat}
          emptyMessage="Nenhuma SAT finalizada encontrada com os filtros aplicados"
        />
      </ScrollArea>

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
