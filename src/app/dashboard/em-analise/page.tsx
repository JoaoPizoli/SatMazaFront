"use client"

import { useState, useMemo, useCallback } from "react"
import { PageTemplate } from "@/components/page-template"
import { SatListTable } from "@/components/sat-list-table"
import {
  SatDetailDialog,
  type AVTFormData,
} from "@/components/sat-detail-dialog"
import { useSats } from "@/hooks/use-sats"
import { updateAvt, changeStatusAvt } from "@/lib/api/avt"
import { changeStatusSat } from "@/lib/api/sat"
import { useAuth } from "@/contexts/auth-context"
import {
  type SAT,
  SATStatus,
  SATDestino,
  UserRole,
  AVTStatus,
} from "@/types"
import { Loader2 } from "lucide-react"

function getDestinoByRole(tipo: UserRole): SATDestino | null {
  if (tipo === UserRole.BAGUA) return SATDestino.BASE_AGUA
  if (tipo === UserRole.BSOLVENTE) return SATDestino.BASE_SOLVENTE
  return null
}

export default function EmAnalisePage() {
  const { user } = useAuth()
  const [selectedSat, setSelectedSat] = useState<SAT | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const destino = getDestinoByRole(user?.tipo ?? UserRole.BAGUA)

  const { sats: allSats, isLoading, refetch } = useSats(
    destino ? { laboratorio: destino } : {}
  )

  // SATs em análise para esta base
  const satsEmAnalise = useMemo(
    () =>
      allSats.filter(
        (s) => s.destino === destino && s.status === SATStatus.EM_ANALISE
      ),
    [allSats, destino]
  )

  const handleSelectSat = useCallback((sat: SAT) => {
    setSelectedSat(sat)
    setDialogOpen(true)
  }, [])

  const handleSave = useCallback(
    async (avtData: AVTFormData) => {
      if (!selectedSat?.avt) return
      try {
        await updateAvt(selectedSat.avt.id, {
          averigucao_tecnica: avtData.averigucao_tecnica,
          possiveis_causas: avtData.possiveis_causas,
          lote: avtData.lote,
          reclamacao_procedente: avtData.reclamacao_procedente,
          troca: avtData.troca,
          recolhimento_lote: avtData.recolhimento_lote,
          solucao: avtData.solucao,
          data: avtData.data,
          media_id: avtData.media_id,
        })
        refetch()
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao salvar AVT"
        alert(message)
      }
    },
    [selectedSat, refetch]
  )

  const handleFinalizar = useCallback(
    async (satId: string, avtData: AVTFormData) => {
      if (!selectedSat?.avt) return
      try {
        await updateAvt(selectedSat.avt.id, {
          averigucao_tecnica: avtData.averigucao_tecnica,
          possiveis_causas: avtData.possiveis_causas,
          lote: avtData.lote,
          reclamacao_procedente: avtData.reclamacao_procedente,
          troca: avtData.troca,
          recolhimento_lote: avtData.recolhimento_lote,
          solucao: avtData.solucao,
          data: avtData.data,
          media_id: avtData.media_id,
        })
        await changeStatusAvt(selectedSat.avt.id, AVTStatus.CONCLUIDO)
        await changeStatusSat(satId, SATStatus.FINALIZADA)
        refetch()
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao finalizar análise"
        alert(message)
      }
    },
    [selectedSat, refetch]
  )

  if (isLoading) {
    return (
      <PageTemplate title="Em Análise" description="Carregando...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageTemplate>
    )
  }

  return (
    <PageTemplate
      title="Em Análise"
      description="SATs com análise técnica em andamento"
    >
      <SatListTable
        sats={satsEmAnalise}
        onSelectSat={handleSelectSat}
        emptyMessage="Nenhuma SAT em análise no momento"
      />

      <SatDetailDialog
        sat={selectedSat}
        avt={selectedSat?.avt ?? null}
        mode="editar"
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        onChangeStatus={handleFinalizar}
      />
    </PageTemplate>
  )
}
