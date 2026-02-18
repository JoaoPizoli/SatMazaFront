"use client"

import { useState, useMemo, useCallback } from "react"
import { PageTemplate } from "@/components/page-template"
import { SatListTable } from "@/components/sat-list-table"
import {
  SatDetailDialog,
  type AVTFormData,
} from "@/components/sat-detail-dialog"
import { useSats } from "@/hooks/use-sats"
import { createAvt } from "@/lib/api/avt"
import { changeStatusSat, redirecionarSat } from "@/lib/api/sat"
import { useAuth } from "@/contexts/auth-context"
import {
  type SAT,
  SATStatus,
  SATDestino,
  UserRole,
  AVTStatus,
} from "@/types"
import { Loader2 } from "lucide-react"

/** Mapeia a role do usuário para o destino correto das SATs */
function getDestinoByRole(tipo: UserRole): SATDestino | null {
  if (tipo === UserRole.BAGUA) return SATDestino.BASE_AGUA
  if (tipo === UserRole.BSOLVENTE) return SATDestino.BASE_SOLVENTE
  return null
}

/** Mapeia a role para o status "enviado" correspondente */
function getEnviadoStatusByRole(tipo: UserRole): SATStatus | null {
  if (tipo === UserRole.BAGUA) return SATStatus.ENVIADO_BAGUA
  if (tipo === UserRole.BSOLVENTE) return SATStatus.ENVIADO_BSOLVENTE
  return null
}

export default function RecebidasPage() {
  const { user } = useAuth()
  const [selectedSat, setSelectedSat] = useState<SAT | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const destino = getDestinoByRole(user?.tipo ?? UserRole.BAGUA)
  const enviadoStatus = getEnviadoStatusByRole(user?.tipo ?? UserRole.BAGUA)

  const { sats: allSats, isLoading, refetch } = useSats(
    destino ? { laboratorio: destino } : {}
  )

  // SATs recebidas: status "enviado" para esta base
  const satsRecebidas = useMemo(
    () =>
      allSats.filter(
        (s) => s.destino === destino && s.status === enviadoStatus
      ),
    [allSats, destino, enviadoStatus]
  )

  const handleSelectSat = useCallback((sat: SAT) => {
    setSelectedSat(sat)
    setDialogOpen(true)
  }, [])

  const handleIniciarAnalise = useCallback(
    async (satId: string, avtData: AVTFormData) => {
      try {
        await createAvt(satId, {
          averigucao_tecnica: avtData.averigucao_tecnica,
          possiveis_causas: avtData.possiveis_causas,
          lote: avtData.lote,
          reclamacao_procedente: avtData.reclamacao_procedente,
          troca: avtData.troca,
          recolhimento_lote: avtData.recolhimento_lote,
          solucao: avtData.solucao,
          data: avtData.data,
          status: AVTStatus.EM_ANALISE,
          media_id: null,
        })
        await changeStatusSat(satId, SATStatus.EM_ANALISE)
        refetch()
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao iniciar análise"
        alert(message)
      }
    },
    [refetch]
  )

  const handleRedirect = useCallback(async (satId: string) => {
    try {
      await redirecionarSat(satId);
      // alert("SAT redirecionada com sucesso!");
      refetch();
      setDialogOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao redirecionar SAT"
      alert(message)
    }
  }, [refetch]);

  if (isLoading) {
    return (
      <PageTemplate title="SATs Recebidas" description="Carregando...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageTemplate>
    )
  }

  return (
    <PageTemplate
      title="SATs Recebidas"
      description="SATs recebidas aguardando início da análise técnica"
    >
      <SatListTable
        sats={satsRecebidas}
        onSelectSat={handleSelectSat}
        emptyMessage="Nenhuma SAT recebida no momento"
      />

      <SatDetailDialog
        sat={selectedSat}
        avt={null}
        mode="criar"
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onChangeStatus={handleIniciarAnalise}
        onRedirect={handleRedirect}
      />
    </PageTemplate>
  )
}
