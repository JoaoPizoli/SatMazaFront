"use client"

import { useState, useMemo, useCallback } from "react"
import { PageTemplate } from "@/components/page-template"
import { SatListTable } from "@/components/sat-list-table"
import { SatDetailDialog } from "@/components/sat-detail-dialog"
import { useSats } from "@/hooks/use-sats"
import { useAuth } from "@/contexts/auth-context"
import {
  type SAT,
  SATStatus,
  SATDestino,
  UserRole,
} from "@/types"
import { Loader2 } from "lucide-react"

function getDestinoByRole(tipo: UserRole): SATDestino | null {
  if (tipo === UserRole.BAGUA) return SATDestino.BASE_AGUA
  if (tipo === UserRole.BSOLVENTE) return SATDestino.BASE_SOLVENTE
  return null
}

export default function FinalizadasPage() {
  const { user } = useAuth()
  const [selectedSat, setSelectedSat] = useState<SAT | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

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

  const handleSelectSat = useCallback((sat: SAT) => {
    setSelectedSat(sat)
    setDialogOpen(true)
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

  return (
    <PageTemplate
      title="Finalizadas"
      description="SATs com análise técnica concluída"
    >
      <SatListTable
        sats={satsFinalizadas}
        onSelectSat={handleSelectSat}
        emptyMessage="Nenhuma SAT finalizada no momento"
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
