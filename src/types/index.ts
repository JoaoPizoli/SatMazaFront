/**
 * Tipos TypeScript globais para o sistema SatMaza
 * Alinhados com o backend (SatEntity, AvtEntity, MediaAttachmentEntity, UsuarioEntity)
 */

// ─── Roles ───────────────────────────────────────────────────────────────────

export enum UserRole {
  ADMIN = "ADMIN",
  ORQUESTRADOR = "ORQUESTRADOR",
  BAGUA = "BAGUA",
  BSOLVENTE = "BSOLVENTE",
  REPRESENTANTE = "REPRESENTANTE",
  REPRE_ATENDENTE = "REPRE_ATENDENTE",
  CHEFE_REPRE_ATENDENTE = "CHEFE_REPRE_ATENDENTE",
}

export const UserRoleLabels: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Administrador",
  [UserRole.ORQUESTRADOR]: "Orquestrador",
  [UserRole.BAGUA]: "Base Água",
  [UserRole.BSOLVENTE]: "Base Solvente",
  [UserRole.REPRESENTANTE]: "Representante",
  [UserRole.REPRE_ATENDENTE]: "Representante Comercial",
  [UserRole.CHEFE_REPRE_ATENDENTE]: "Chefe Representante Comercial",
}

/** Perfis do time comercial (acesso a Indicadores e Acompanhamento de SATs) */
export function isComercialRole(tipo: UserRole | undefined | null): boolean {
  return tipo === UserRole.REPRE_ATENDENTE || tipo === UserRole.CHEFE_REPRE_ATENDENTE
}

// ─── Usuário / Auth ──────────────────────────────────────────────────────────

/** Alinhado com UsuarioEntity do backend (sem senha) */
export type User = {
  id: number
  usuario: string
  nome: string | null
  email: string | null
  tipo: UserRole
  createdAt: string
  password_changed: boolean
}

export type AuthState = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

// ─── SAT ─────────────────────────────────────────────────────────────────────

export enum SATStatus {
  PENDENTE = "PENDENTE",
  ENVIADO_BAGUA = "ENVIADO_BAGUA",
  ENVIADO_BSOLVENTE = "ENVIADO_BSOLVENTE",
  EM_ANALISE = "EM_ANALISE",
  FINALIZADA = "FINALIZADA",
}

export const SATStatusLabels: Record<SATStatus, string> = {
  [SATStatus.PENDENTE]: "Pendente",
  [SATStatus.ENVIADO_BAGUA]: "Enviada - Base Água",
  [SATStatus.ENVIADO_BSOLVENTE]: "Enviada - Base Solvente",
  [SATStatus.EM_ANALISE]: "Em Análise",
  [SATStatus.FINALIZADA]: "Finalizada",
}

export enum SATDestino {
  BASE_AGUA = "BASE_AGUA",
  BASE_SOLVENTE = "BASE_SOLVENTE",
}

export const SATDestinoLabels: Record<SATDestino, string> = {
  [SATDestino.BASE_AGUA]: "Base Água",
  [SATDestino.BASE_SOLVENTE]: "Base Solvente",
}

/** Representante resumido (vem da relation do backend) */
export type RepresentanteResumido = {
  id: number
  usuario: string
  nome?: string | null  // Added name
  email?: string | null
  tipo: string
}

export type SatLote = {
  id: string
  lote: string
  validade: string
  sat_id: string
}

/** Alinhado com SatEntity do backend (com relations carregadas) */
export type SAT = {
  id: string
  seq: number
  codigo: string
  cliente: string
  cidade: string
  produtos: string
  quantidade: number
  sem_lote: boolean
  lotes: SatLote[] // Agora é uma relação
  contato: string
  representante_id: string
  representante?: RepresentanteResumido
  telefone: string
  reclamacao: string
  status: SATStatus
  destino: SATDestino | null
  evidencias: MediaAttachment[]
  avt?: AVT | null
  createdAt: string
  updatedAt: string
}

// ─── Mídia / Evidência ───────────────────────────────────────────────────────

export enum MediaStatus {
  PENDING = "PENDING",
  READY = "READY",
  FAILED = "FAILED",
}

export type MediaAttachment = {
  id: string
  sat_id: string
  blobName: string
  mimeType: string
  sizeBytes: number
  originalName?: string
  status: MediaStatus
  context?: 'sat_evidencia' | 'avt_laudo'
  createdAt: string
}

// ─── AVT (Averiguação Técnica) ───────────────────────────────────────────────

export enum AVTStatus {
  PENDENTE = "PENDENTE",
  EM_ANALISE = "EM_ANALISE",
  CONCLUIDO = "CONCLUIDO",
}

export const AVTStatusLabels: Record<AVTStatus, string> = {
  [AVTStatus.PENDENTE]: "Pendente",
  [AVTStatus.EM_ANALISE]: "Em Análise",
  [AVTStatus.CONCLUIDO]: "Concluído",
}

/** Alinhado com AvtEntity do backend */
export type AVT = {
  id: string
  sat_id: string
  averigucao_tecnica: string
  possiveis_causas: string
  lote: string
  reclamacao_procedente: boolean
  troca: boolean
  recolhimento_lote: boolean
  solucao: string
  data: string
  createdAt: string
  usuario_id: number
  status: AVTStatus
}

/** DTO para criação de AVT */
export type CreateAvtDto = {
  averigucao_tecnica: string
  possiveis_causas: string
  lote: string
  reclamacao_procedente: boolean
  troca: boolean
  recolhimento_lote: boolean
  solucao: string
  data: string
  status: AVTStatus
}

// ─── ERP ─────────────────────────────────────────────────────────────────────

/** Dados de cliente vindo da view VW_CLIENTES_ATIVOS do ERP */
export type ErpCliente = {
  CODCLI: string
  NOMCLI: string
  CODREP: string
  NOMREP: string
  CIDADE: string
  UF: string
}

/** Dados do representante vindo da view VW_CLIENTES_ATIVOS do ERP */
export type ErpRepresentante = {
  CODREP: string
  NOMREP: string
}

/** Produto vindo da view VW_PRODUTOS do ERP */
export type ErpProduto = {
  CODIGO_ITEM: string
  DESCRICAO_ITEM: string
}

// ─── Genéricos ───────────────────────────────────────────────────────────────

export type ApiResponse<T> = {
  data: T
  error?: string
  success: boolean
}

export type DashboardMetrics = {
  pendentes: number
  enviadasBagua: number
  enviadasBsolvente: number
  finalizadas: number
  total: number
}

export type DashboardFilter = {
  startDate?: string
  endDate?: string
  representanteId?: number
  representanteCodigo?: string
  produto?: string
  procedente?: 'true' | 'false'
  semLote?: 'true' | 'false'
}

export type DashboardChartData = {
  name: string
  value: number
}

export type ProcedenteByLabData = {
  name: string
  procedente: number
  improcedente: number
}

export type MonthlySatData = {
  name: string // 'YYYY-MM'
  total: number
  procedentes: number
}

export type ResolutionTimeData = {
  mediaDias: number | null
  total: number
}

export type TrocasRecolhimentosData = {
  trocas: number
  recolhimentos: number
}

export type PaginatedResponse<T> = {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// ─── Relatório de SATs (espelha src/relatorio/relatorio.types.ts do backend) ──

/** Período do relatório: dias de Brasília, fim inclusivo */
export type RelatorioPeriodo = {
  inicio: string // 'AAAA-MM-DD'
  fim: string // 'AAAA-MM-DD'
  dias: number
  mesesCompletos: number | null
  rotulo: string // 'Setembro/2026', '10/09/2026 a 24/09/2026'
}

export type RelatorioIndicadores = {
  totalSats: number
  finalizadas: number
  emAberto: number
  procedentes: number
  improcedentes: number
  aguardandoDecisao: number
  taxaProcedencia: number | null
  tempoMedioDias: number | null
  baseTempoMedio: number
  trocas: number
  recolhimentos: number
}

export type RelatorioVariacaoSituacao = "ALTA" | "QUEDA" | "ESTAVEL" | "NOVO" | "SEM_DADOS"
export type RelatorioVariacaoAvaliacao = "POSITIVA" | "NEGATIVA" | "NEUTRA"

export type RelatorioComparacao = {
  chave: keyof RelatorioIndicadores
  titulo: string
  formato: "numero" | "percentual" | "dias"
  atual: number | null
  anterior: number | null
  atualTexto: string
  anteriorTexto: string
  variacao: number | null
  unidadeVariacao: "%" | "p.p."
  situacao: RelatorioVariacaoSituacao
  avaliacao: RelatorioVariacaoAvaliacao
  texto: string // '+12,5%', '-1,5 p.p.', 'novo', '—'
}

export type RelatorioProcedencia = "Procedente" | "Improcedente" | "Pendente"

export type RelatorioSatItem = {
  id: string
  codigo: string
  abertura: string // ISO
  cliente: string
  cidade: string
  produto: string
  quantidade: number
  lotes: string
  representante: string
  status: SATStatus
  statusTexto: string
  laboratorio: string | null
  procedencia: RelatorioProcedencia
  troca: boolean
  recolhimento: boolean
}

export type RelatorioDados = {
  periodo: RelatorioPeriodo
  periodoAnterior: RelatorioPeriodo
  periodoAnteriorSemDados: boolean
  geradoEm: string
  indicadores: RelatorioIndicadores
  indicadoresAnterior: RelatorioIndicadores
  comparacao: RelatorioComparacao[]
  porStatus: DashboardChartData[]
  porLaboratorio: DashboardChartData[]
  procedencia: DashboardChartData[]
  procedenciaPorLaboratorio: ProcedenteByLabData[]
  topRepresentantes: DashboardChartData[]
  topProdutos: DashboardChartData[]
  lotesReincidentes: DashboardChartData[]
  evolucaoMensal: MonthlySatData[]
  sats: RelatorioSatItem[]
}

export type RelatorioPreview = {
  assunto: string
  html: string
}

export type RelatorioDestinatario = {
  id: number
  email: string
  nome: string | null
  ativo: boolean
  createdAt: string
  updatedAt: string
}

export type RelatorioConfiguracao = {
  id: number
  envio_automatico_ativo: boolean
  dia_envio: number
  hora_envio: number
  ativado_em: string | null
  atualizado_por: string | null
  updatedAt: string
}

export type RelatorioEnvioTipo = "AUTOMATICO" | "MANUAL"
export type RelatorioEnvioStatus = "PROCESSANDO" | "SUCESSO" | "FALHA"

export type RelatorioEnvio = {
  id: string
  tipo: RelatorioEnvioTipo
  status: RelatorioEnvioStatus
  periodo_inicio: string // 'AAAA-MM-DD'
  periodo_fim: string
  destinatarios: string[]
  total_sats: number | null
  erro: string | null
  enviado_por: string | null // null = envio automático
  concluido_em: string | null
  createdAt: string
  updatedAt: string
}

export type RelatorioProximoEnvio = {
  situacao: "AGENDADO" | "PENDENTE" | "RETENTATIVA" | "EM_ANDAMENTO"
  data: string // 'AAAA-MM-DD' (Brasília) do horário agendado
  hora: number
  periodo: RelatorioPeriodo
  novaTentativaEm?: string // ISO — só em RETENTATIVA
}

export type RelatorioConfiguracaoResposta = {
  configuracao: RelatorioConfiguracao
  destinatariosAtivos: number
  proximoEnvio: RelatorioProximoEnvio | null
  ultimoEnvioAutomatico: RelatorioEnvio | null
}
