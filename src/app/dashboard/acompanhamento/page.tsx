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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Inbox, TestTubes, CheckCircle } from "lucide-react"

const EM_LABORATORIO_STATUSES: SATStatus[] = [
  SATStatus.ENVIADO_BAGUA,
  SATStatus.ENVIADO_BSOLVENTE,
  SATStatus.EM_ANALISE,
]

function CountCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  color: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

export default function AcompanhamentoSatsPage() {
  const { user } = useAuth()
  const [selectedSat, setSelectedSat] = useState<SAT | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [labFilter, setLabFilter] = useState<SATDestino | "TODOS">("TODOS")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")

  // O backend já restringe as SATs aos representantes vinculados ao
  // REPRE_ATENDENTE; o CHEFE_REPRE_ATENDENTE recebe todas.
  const { sats: allSats, isLoading } = useSats()

  const satsFiltered = useMemo(() => {
    let filtered = allSats

    if (labFilter !== "TODOS") {
      filtered = filtered.filter((s) => s.destino === labFilter)
    }
    if (dataInicio) {
      const inicio = new Date(dataInicio)
      filtered = filtered.filter((s) => new Date(s.createdAt) >= inicio)
    }
    if (dataFim) {
      const fim = new Date(dataFim)
      fim.setHours(23, 59, 59, 999)
      filtered = filtered.filter((s) => new Date(s.createdAt) <= fim)
    }

    return [...filtered].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  }, [allSats, labFilter, dataInicio, dataFim])

  const abertas = useMemo(
    () => satsFiltered.filter((s) => s.status === SATStatus.PENDENTE),
    [satsFiltered]
  )
  const emLaboratorio = useMemo(
    () => satsFiltered.filter((s) => EM_LABORATORIO_STATUSES.includes(s.status)),
    [satsFiltered]
  )
  const finalizadas = useMemo(
    () => satsFiltered.filter((s) => s.status === SATStatus.FINALIZADA),
    [satsFiltered]
  )

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

  const description =
    user?.tipo === UserRole.CHEFE_REPRE_ATENDENTE
      ? "SATs de todos os representantes do sistema"
      : "SATs dos representantes vinculados a você"

  if (isLoading) {
    return (
      <PageTemplate title="Acompanhamento de SATs" description="Carregando...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageTemplate>
    )
  }

  return (
    <PageTemplate title="Acompanhamento de SATs" description={description}>
      {/* Contadores */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <CountCard
          title="Abertas"
          value={abertas.length}
          icon={Inbox}
          color="text-blue-500"
        />
        <CountCard
          title="Em Laboratório"
          value={emLaboratorio.length}
          icon={TestTubes}
          color="text-amber-500"
        />
        <CountCard
          title="Finalizadas"
          value={finalizadas.length}
          icon={CheckCircle}
          color="text-emerald-500"
        />
      </div>

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
        infoText={`${satsFiltered.length} SATs no total`}
      />

      <Tabs defaultValue="abertas">
        <TabsList>
          <TabsTrigger value="abertas">
            Abertas ({abertas.length})
          </TabsTrigger>
          <TabsTrigger value="laboratorio">
            Em Laboratório ({emLaboratorio.length})
          </TabsTrigger>
          <TabsTrigger value="finalizadas">
            Finalizadas ({finalizadas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="abertas">
          <ScrollArea className="max-h-[calc(100vh-420px)]">
            <SatListTable
              sats={abertas}
              onSelectSat={handleSelectSat}
              emptyMessage="Nenhuma SAT aberta encontrada"
            />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="laboratorio">
          <ScrollArea className="max-h-[calc(100vh-420px)]">
            <SatListTable
              sats={emLaboratorio}
              onSelectSat={handleSelectSat}
              emptyMessage="Nenhuma SAT em laboratório encontrada"
            />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="finalizadas">
          <ScrollArea className="max-h-[calc(100vh-420px)]">
            <SatListTable
              sats={finalizadas}
              onSelectSat={handleSelectSat}
              emptyMessage="Nenhuma SAT finalizada encontrada"
            />
          </ScrollArea>
        </TabsContent>
      </Tabs>

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
