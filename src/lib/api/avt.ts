import { apiPost, apiPatch } from "@/lib/api"
import type { AVT, AVTStatus } from "@/types"

/**
 * Criar AVT vinculada a uma SAT.
 */
export async function createAvt(
  satId: string,
  data: {
    media_id: string | null
    averigucao_tecnica: string
    possiveis_causas: string
    lote: string
    reclamacao_procedente: boolean
    troca: boolean
    recolhimento_lote: boolean
    solucao: string
    data: string
    status: AVTStatus
  },
): Promise<AVT> {
  return apiPost<AVT>(`/sat/${satId}/avt`, data)
}

/**
 * Atualizar AVT existente.
 */
export async function updateAvt(
  avtId: string,
  data: Partial<{
    media_id: string | null
    averigucao_tecnica: string
    possiveis_causas: string
    lote: string
    reclamacao_procedente: boolean
    troca: boolean
    recolhimento_lote: boolean
    solucao: string
    data: string
    status: AVTStatus
  }>,
): Promise<AVT> {
  return apiPatch<AVT>(`/sat/avt/${avtId}`, data)
}

/**
 * Alterar status de uma AVT.
 */
export async function changeStatusAvt(avtId: string, status: AVTStatus): Promise<AVT> {
  return apiPatch<AVT>(`/sat/avt/${avtId}/status`, { status })
}
