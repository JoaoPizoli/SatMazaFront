import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api"
import type { SAT, SATStatus, SATDestino, DashboardFilter, DashboardChartData, ProcedenteByLabData } from "@/types"

interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// Limite máximo aceito pelo backend (PaginationDto @Max(100))
const PAGE_LIMIT = 100
// Trava de segurança contra loop infinito (100 páginas * 100 = 10.000 SATs)
const MAX_PAGES = 100

/**
 * Busca TODAS as páginas de um endpoint paginado de SATs e concatena o resultado.
 * Necessário porque os endpoints retornam no máximo 100 registros por página;
 * as telas (dashboards e listagens) precisam do conjunto completo para
 * calcular totais e filtrar/buscar no cliente.
 */
async function fetchAllPages(basePath: string): Promise<SAT[]> {
  const all: SAT[] = []
  let page = 1
  let totalPages = 1

  do {
    const sep = basePath.includes("?") ? "&" : "?"
    const res = await apiGet<PaginatedResponse<SAT>>(
      `${basePath}${sep}page=${page}&limit=${PAGE_LIMIT}`,
    )
    all.push(...res.data)
    totalPages = res.meta?.totalPages ?? 1
    page++
  } while (page <= totalPages && page <= MAX_PAGES)

  return all
}

/**
 * Buscar todas as SATs (todas as páginas).
 */
export async function getAllSats(): Promise<SAT[]> {
  return fetchAllPages("/sat")
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
  return fetchAllPages(`/sat/status/${status}`)
}

/**
 * Buscar SATs por laboratório de destino.
 */
export async function getSatsByLab(laboratorio: SATDestino): Promise<SAT[]> {
  return fetchAllPages(`/sat/laboratorio/${laboratorio}`)
}

/**
 * Buscar SATs de um representante específico.
 */
export async function getSatsByRepresentante(representanteId: number): Promise<SAT[]> {
  return fetchAllPages(`/sat/representante/${representanteId}`)
}

/**
 * Criar nova SAT.
 */
export async function createSat(data: {
  cliente: string
  cidade: string
  produtos: string
  quantidade: number
  sem_lote?: boolean
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
    sem_lote: boolean
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
  if (filter.procedente) query.append('procedente', filter.procedente)
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

/**
 * Buscar estatísticas de SATs por procedência (procedente/improcedente/pendente).
 */
export async function getSatsByProcedente(
  filter: DashboardFilter
): Promise<DashboardChartData[]> {
  const query = buildFilterQuery(filter)
  return apiGet<DashboardChartData[]>(`/sat/dashboard/procedente?${query}`)
}

/**
 * Buscar estatísticas de procedência agrupadas por laboratório.
 */
export async function getProcedenteByLab(
  filter: DashboardFilter
): Promise<ProcedenteByLabData[]> {
  const query = buildFilterQuery(filter)
  return apiGet<ProcedenteByLabData[]>(`/sat/dashboard/procedente-by-lab?${query}`)
}

/**
 * Baixar PDF do relatório AVT de uma SAT finalizada.
 */
export async function downloadSatPdf(satId: string, codigo: string): Promise<void> {
  const { getStoredToken } = await import("@/lib/api")
  const token = getStoredToken()
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3040"

  const res = await fetch(`${API_URL}/sat/${satId}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    throw new Error("Erro ao gerar PDF do relatório.")
  }

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${codigo}_AVT.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
