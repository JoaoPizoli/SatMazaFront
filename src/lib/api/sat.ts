import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api"
import type { SAT, SATStatus, SATDestino, DashboardFilter, DashboardChartData } from "@/types"

/**
 * Buscar todas as SATs.
 */
export async function getAllSats(): Promise<SAT[]> {
  return apiGet<SAT[]>("/sat")
}

/**
 * Buscar SAT por ID.
 */
export async function getSatById(id: string): Promise<SAT> {
  return apiGet<SAT>(`/sat/${id}`)
}

/**
 * Buscar SATs por status.
 */
export async function getSatsByStatus(status: SATStatus): Promise<SAT[]> {
  return apiGet<SAT[]>(`/sat/status/${status}`)
}

/**
 * Buscar SATs por laboratório de destino.
 */
export async function getSatsByLab(laboratorio: SATDestino): Promise<SAT[]> {
  return apiGet<SAT[]>(`/sat/laboratorio/${laboratorio}`)
}

/**
 * Buscar SATs de um representante específico.
 */
export async function getSatsByRepresentante(representanteId: number): Promise<SAT[]> {
  return apiGet<SAT[]>(`/sat/representante/${representanteId}`)
}

/**
 * Criar nova SAT.
 */
export async function createSat(data: {
  cliente: string
  cidade: string
  produtos: string
  quantidade: number
  lotes: { lote: string; validade: string }[]
  contato: string
  representante_id: number
  telefone: string
  reclamacao: string
}): Promise<SAT> {
  return apiPost<SAT>("/sat", data)
}

/**
 * Atualizar SAT existente (parcial).
 */
export async function updateSat(
  id: string,
  data: Partial<{
    cliente: string
    cidade: string
    produtos: string
    quantidade: number
    lotes: { lote: string; validade: string }[]
    contato: string
    representante_id: number
    telefone: string
    reclamacao: string
    destino: SATDestino
  }>,
): Promise<SAT> {
  return apiPatch<SAT>(`/sat/${id}`, data)
}

/**
 * Excluir SAT.
 */
export async function deleteSat(id: string): Promise<void> {
  return apiDelete(`/sat/${id}`)
}

/**
 * Alterar status de uma SAT.
 */
export async function changeStatusSat(id: string, status: SATStatus): Promise<SAT> {
  return apiPatch<SAT>(`/sat/${id}/status`, { status })
}

/**
 * Redirecionar SAT para o outro laboratório.
 */
export async function redirecionarSat(id: string): Promise<SAT> {
  return apiPatch<SAT>(`/sat/${id}/redirecionar`, {})
}

/**
 * Helper para construir a query string de filtros
 */
function buildFilterQuery(filter: DashboardFilter): string {
  const query = new URLSearchParams()
  if (filter.startDate) query.append('startDate', filter.startDate)
  if (filter.endDate) query.append('endDate', filter.endDate)
  if (filter.representanteId) query.append('representanteId', String(filter.representanteId))
  if (filter.representanteCodigo) query.append('representanteCodigo', filter.representanteCodigo) // Added
  if (filter.produto) query.append('produto', filter.produto)
  return query.toString()
}

/**
 * Buscar estatísticas de SATs por setor (laboratório de destino).
 */
export async function getSatsBySector(
  filter: DashboardFilter
): Promise<DashboardChartData[]> {
  const query = buildFilterQuery(filter)
  return apiGet<DashboardChartData[]>(`/sat/dashboard/sector?${query}`)
}

/**
 * Buscar estatísticas de SATs por representante.
 */
export async function getSatsByRepresentative(
  filter: DashboardFilter
): Promise<DashboardChartData[]> {
  const query = buildFilterQuery(filter)
  return apiGet<DashboardChartData[]>(`/sat/dashboard/representative?${query}`)
}

/**
 * Buscar top produtos com mais SATs.
 */
export async function getTopProducts(
  filter: DashboardFilter
): Promise<DashboardChartData[]> {
  const query = buildFilterQuery(filter)
  return apiGet<DashboardChartData[]>(`/sat/dashboard/products?${query}`)
}

/**
 * Buscar estatísticas de SATs por status.
 */
export async function getSatsStatusStats(
  filter: DashboardFilter
): Promise<DashboardChartData[]> {
  const query = buildFilterQuery(filter)
  return apiGet<DashboardChartData[]>(`/sat/dashboard/status?${query}`)
}
