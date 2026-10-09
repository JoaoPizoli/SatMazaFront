import { apiDelete, apiDownload, apiGet, apiPatch, apiPost } from "@/lib/api"
import { nomeArquivoPdf } from "@/lib/relatorio-periodo"
import type {
  PaginatedResponse,
  RelatorioConfiguracao,
  RelatorioConfiguracaoResposta,
  RelatorioDados,
  RelatorioDestinatario,
  RelatorioEnvio,
  RelatorioEnvioCanal,
  RelatorioPreview,
} from "@/types"

// Gerar o relatório consulta vários indicadores e a lista completa de SATs do período
const TIMEOUT_DADOS_MS = 30_000
const TIMEOUT_PDF_MS = 60_000
// Envio = gerar dados + PDF + Microsoft Graph
const TIMEOUT_ENVIO_MS = 90_000

export type PeriodoConsulta = {
  startDate: string // AAAA-MM-DD
  endDate: string // AAAA-MM-DD (inclusivo)
}

function query(periodo: PeriodoConsulta): string {
  return new URLSearchParams({ startDate: periodo.startDate, endDate: periodo.endDate }).toString()
}

/** Mensagem amigável de um erro de chamada à API */
export function mensagemDeErro(error: unknown): string {
  return error instanceof Error && error.message ? error.message : "Erro inesperado. Tente novamente."
}

// ─── Relatório ────────────────────────────────────────────────────────────────

export async function getRelatorioDados(periodo: PeriodoConsulta): Promise<RelatorioDados> {
  return apiGet<RelatorioDados>(`/relatorio/dados?${query(periodo)}`, { timeoutMs: TIMEOUT_DADOS_MS })
}

export async function getRelatorioPreview(periodo: PeriodoConsulta): Promise<RelatorioPreview> {
  return apiGet<RelatorioPreview>(`/relatorio/preview?${query(periodo)}`, { timeoutMs: TIMEOUT_DADOS_MS })
}

export async function downloadRelatorioPdf(periodo: PeriodoConsulta): Promise<void> {
  return apiDownload(
    `/relatorio/pdf?${query(periodo)}`,
    nomeArquivoPdf(periodo.startDate, periodo.endDate),
    { timeoutMs: TIMEOUT_PDF_MS },
  )
}

/**
 * Envia o relatório agora. Sem `destinatarios`/`telefones`, usa a lista de destinatários ativos
 * nos `canais` escolhidos. Retorna um registro por canal: o e-mail já concluído e o WhatsApp
 * em PROCESSANDO (enviado em segundo plano; resultado no histórico).
 */
export async function enviarRelatorio(
  dados: PeriodoConsulta & { destinatarios?: string[]; telefones?: string[]; canais?: RelatorioEnvioCanal[] },
): Promise<RelatorioEnvio[]> {
  return apiPost<RelatorioEnvio[]>("/relatorio/enviar", dados, { timeoutMs: TIMEOUT_ENVIO_MS })
}

export async function getHistoricoRelatorio(page = 1, limit = 20): Promise<PaginatedResponse<RelatorioEnvio>> {
  return apiGet<PaginatedResponse<RelatorioEnvio>>(`/relatorio/historico?page=${page}&limit=${limit}`)
}

// ─── Destinatários ────────────────────────────────────────────────────────────

export async function getDestinatarios(): Promise<RelatorioDestinatario[]> {
  return apiGet<RelatorioDestinatario[]>("/relatorio/destinatarios")
}

/** Precisa de e-mail e/ou telefone (telefone com DDD; o backend normaliza). */
export async function createDestinatario(dados: { email?: string; telefone?: string; nome?: string }): Promise<RelatorioDestinatario> {
  return apiPost<RelatorioDestinatario>("/relatorio/destinatarios", dados)
}

/** `email: null` / `telefone: null` limpam o contato (precisa sobrar um dos dois). */
export async function updateDestinatario(
  id: number,
  dados: { email?: string | null; telefone?: string | null; nome?: string; ativo?: boolean },
): Promise<RelatorioDestinatario> {
  return apiPatch<RelatorioDestinatario>(`/relatorio/destinatarios/${id}`, dados)
}

export async function deleteDestinatario(id: number): Promise<void> {
  await apiDelete(`/relatorio/destinatarios/${id}`)
}

// ─── Envio automático ─────────────────────────────────────────────────────────

export async function getConfiguracaoRelatorio(): Promise<RelatorioConfiguracaoResposta> {
  return apiGet<RelatorioConfiguracaoResposta>("/relatorio/configuracao")
}

export async function updateConfiguracaoRelatorio(
  dados: Partial<Pick<RelatorioConfiguracao, "envio_automatico_ativo" | "dia_envio" | "hora_envio">>,
): Promise<RelatorioConfiguracaoResposta> {
  return apiPatch<RelatorioConfiguracaoResposta>("/relatorio/configuracao", dados)
}
