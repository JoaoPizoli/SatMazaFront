"use client"

import { useState, useCallback } from "react"
import { PageTemplate } from "@/components/page-template"
import { SatListTable } from "@/components/sat-list-table"
import { SatSendDialog } from "@/components/sat-send-dialog"
import { useSats } from "@/hooks/use-sats"
import { updateSat, changeStatusSat } from "@/lib/api/sat"
import {
  type SAT,
  SATStatus,
  SATDestino,
} from "@/types"
import { Loader2 } from "lucide-react"

export default function PendentesPage() {
  const [selectedSat, setSelectedSat] = useState<SAT | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { sats, isLoading, refetch } = useSats({ status: SATStatus.PENDENTE })

  const handleSelectSat = useCallback((sat: SAT) => {
    setSelectedSat(sat)
    setDialogOpen(true)
  }, [])

  const handleSend = useCallback(
    async (satId: string, laboratorio: SATDestino) => {
      try {
        await updateSat(satId, { destino: laboratorio })
        const statusMap: Record<SATDestino, SATStatus> = {
          [SATDestino.BASE_AGUA]: SATStatus.ENVIADO_BAGUA,
          [SATDestino.BASE_SOLVENTE]: SATStatus.ENVIADO_BSOLVENTE,
        }
        await changeStatusSat(satId, statusMap[laboratorio])
        refetch()
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao enviar SAT"
        alert(message)
      }
    },
    [refetch]
  )

  if (isLoading) {
    return (
      <PageTemplate title="SATs Pendentes" description="Carregando...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageTemplate>
    )
  }

  return (
    <PageTemplate
      title="SATs Pendentes"
      description="SATs abertas aguardando envio para laboratório"
    >
      <SatListTable
        sats={sats}
        onSelectSat={handleSelectSat}
        emptyMessage="Nenhuma SAT pendente no momento"
      />

      <SatSendDialog
        sat={selectedSat}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSend={handleSend}
      />
    </PageTemplate>
  )
}

