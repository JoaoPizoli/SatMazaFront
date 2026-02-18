import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api"
import type { MediaAttachment } from "@/types"

// ── Constantes de validação (espelham o backend) ─────────────────────────────

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

export const ALLOWED_SAT_EVIDENCE_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml',
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv', 'video/mpeg', 'video/3gpp',
]

export const ALLOWED_AVT_LAUDO_TYPES = [
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
]

export const SAT_EVIDENCE_ACCEPT = "image/*,video/*"
export const AVT_LAUDO_ACCEPT = ".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp,.bmp"

// ── API calls ────────────────────────────────────────────────────────────────

/**
 * Gerar SAS URL para upload de arquivo no Azure Blob Storage.
 */
export async function generateSasUrl(data: {
  satId: string
  mimeType: string
  sizeBytes: number
  originalName?: string
  context: 'sat_evidencia' | 'avt_laudo'
}): Promise<{ sasUrl: string; mediaId: string }> {
  return apiPost<{ sasUrl: string; mediaId: string }>("/media/generate-sas", data)
}

/**
 * Confirmar upload de arquivo no Azure.
 */
export async function confirmUpload(mediaId: string): Promise<MediaAttachment> {
  return apiPatch<MediaAttachment>(`/media/${mediaId}/confirm`)
}

/**
 * Obter URL de visualização/download para uma mídia.
 */
export async function getViewUrl(mediaId: string): Promise<{ viewUrl: string }> {
  return apiGet<{ viewUrl: string }>(`/media/${mediaId}/view`)
}

/**
 * Buscar todas as mídias de uma SAT.
 */
export async function getMediaBySat(satId: string): Promise<MediaAttachment[]> {
  return apiGet<MediaAttachment[]>(`/media/sat/${satId}`)
}

/**
 * Buscar mídia por ID.
 */
export async function getMediaById(id: string): Promise<MediaAttachment> {
  return apiGet<MediaAttachment>(`/media/${id}`)
}

/**
 * Excluir mídia.
 */
export async function deleteMedia(id: string): Promise<void> {
  return apiDelete(`/media/${id}`)
}

// ── Upload direto para Azure Blob ────────────────────────────────────────────

/**
 * Faz upload de um arquivo diretamente para o Azure Blob Storage via SAS URL.
 * PUT com headers corretos para Block Blob.
 */
export async function uploadFileToBlob(sasUrl: string, file: File): Promise<void> {
  const response = await fetch(sasUrl, {
    method: "PUT",
    headers: {
      "x-ms-blob-type": "BlockBlob",
      "Content-Type": file.type,
      "Content-Length": String(file.size),
    },
    body: file,
  })

  if (!response.ok) {
    throw new Error(`Upload para Azure falhou: ${response.status} ${response.statusText}`)
  }
}

/**
 * Fluxo completo de upload: gera SAS → envia arquivo → confirma.
 * Retorna o media attachment confirmado.
 */
export async function uploadMedia(
  file: File,
  satId: string,
  context: 'sat_evidencia' | 'avt_laudo',
): Promise<MediaAttachment> {
  // 1. Gerar SAS URL no backend
  const { sasUrl, mediaId } = await generateSasUrl({
    satId,
    mimeType: file.type,
    sizeBytes: file.size,
    originalName: file.name,
    context,
  })

  // 2. Upload direto para Azure Blob
  await uploadFileToBlob(sasUrl, file)

  // 3. Confirmar upload no backend
  return await confirmUpload(mediaId)
}

// ── Validação no frontend ────────────────────────────────────────────────────

export function validateFile(
  file: File,
  context: 'sat_evidencia' | 'avt_laudo',
): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `O arquivo "${file.name}" excede o tamanho máximo de 50 MB.`
  }

  const allowedTypes = context === 'sat_evidencia'
    ? ALLOWED_SAT_EVIDENCE_TYPES
    : ALLOWED_AVT_LAUDO_TYPES

  if (!allowedTypes.includes(file.type)) {
    const tipos = context === 'sat_evidencia'
      ? 'imagens e vídeos'
      : 'PDF, Word, TXT ou imagens'
    return `O arquivo "${file.name}" não é um tipo permitido. Aceitos: ${tipos}.`
  }

  return null
}
