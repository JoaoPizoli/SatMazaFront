"use client"

import { useState, useMemo, useCallback } from "react"
import { PageTemplate } from "@/components/page-template"
import { SatListTable } from "@/components/sat-list-table"
import { SatDetailDialog } from "@/components/sat-detail-dialog"
import { SatFiltersBar } from "@/components/sat-filters-bar"
import { useSats } from "@/hooks/use-sats"
import {
  type SAT,
  SATStatus,
  SATDestino,
} from "@/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2 } from "lucide-react"

export default function SatsEmLaboratorioPage() {
  const [selectedSat, setSelectedSat] = useState<SAT | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [labFilter, setLabFilter] = useState<SATDestino | "TODOS">("TODOS")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")

  const { sats: allSats, isLoading } = useSats()

  // SATs enviadas para laboratório (ENVIADO_BAGUA, ENVIADO_BSOLVENTE ou EM_ANALISE)
  const allEmLaboratorio = useMemo(
    () =>
      allSats
        .filter(
          (s) =>
            s.status === SATStatus.ENVIADO_BAGUA ||
            s.status === SATStatus.ENVIADO_BSOLVENTE ||
            s.status === SATStatus.EM_ANALISE
        )
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() -
            new Date(a.updatedAt).getTime()
        ),
    [allSats]
  )

  // Apply filters
  const satsFiltered = useMemo(() => {
    let filtered = allEmLaboratorio

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
  }, [allEmLaboratorio, labFilter, dataInicio, dataFim])

  const hasActiveFilters = labFilter !== "TODOS" || !!dataInicio || !!dataFim

  const handleSelectSat = useCallback((sat: SAT) => {
    setSelectedSat(sat)
    setDialogOpen(true)
  }, [])

  const handleClearFilters = useCallback(() => {
    setLabFilter("TODOS")
    setDataInicio("")
    setDataFim("")
  }, [])

  if (isLoading) {
    return (
      <PageTemplate title="SATs em Laboratório" description="Carregando...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageTemplate>
    )
  }

  return (
    <PageTemplate
      title="SATs em Laboratório"
      description="SATs enviadas para laboratório aguardando finalização da análise"
    >
      <SatFiltersBar
        showLabFilter
        labFilter={labFilter}
        onLabFilterChange={setLabFilter}
        dataInicio={dataInicio}
        onDataInicioChange={setDataInicio}
        dataFim={dataFim}
        onDataFimChange={setDataFim}
        onClear={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        infoText={`Exibindo ${satsFiltered.length} de ${allEmLaboratorio.length} SATs`}
      />

      <ScrollArea className="max-h-[calc(100vh-280px)]">
        <SatListTable
          sats={satsFiltered}
          onSelectSat={handleSelectSat}
          emptyMessage="Nenhuma SAT em laboratório no momento"
        />
      </ScrollArea>

      {/* Dialog mostrando apenas dados da SAT (sem AVT) */}
      <SatDetailDialog
        sat={selectedSat}
        avt={null}
        mode="visualizar"
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </PageTemplate>
  )
}


