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
}

export const UserRoleLabels: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Administrador",
  [UserRole.ORQUESTRADOR]: "Orquestrador",
  [UserRole.BAGUA]: "Base Água",
  [UserRole.BSOLVENTE]: "Base Solvente",
  [UserRole.REPRESENTANTE]: "Representante",
}

// ─── Usuário / Auth ──────────────────────────────────────────────────────────

/** Alinhado com UsuarioEntity do backend (sem senha) */
export type User = {
  id: number
  usuario: string
  email: string | null
  tipo: UserRole
  createdAt: string
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
  media_id: string | null
  laudo?: MediaAttachment
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
}

// ─── ERP ─────────────────────────────────────────────────────────────────────

/** Dados de cliente vindo da view VW_CLIENTES_ATIVOS do ERP */
export type ErpCliente = {
  CODCLI: string
  NOMCLI: string
  CODREP: string
  NOMREP: string
  CIDADE: string
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
  representanteCodigo?: string // Added
  produto?: string
}

export type DashboardChartData = {
  name: string
  value: number
}
