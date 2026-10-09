import { apiGet, apiPost } from "@/lib/api"
import type { WhatsappStatus } from "@/types"

// Abrir a conexão e enviar o teste passam pelo WhatsApp (pode demorar alguns segundos)
const TIMEOUT_WHATSAPP_MS = 30_000

export async function getWhatsappStatus(): Promise<WhatsappStatus> {
  return apiGet<WhatsappStatus>("/whatsapp/status")
}

/** Reconecta com a sessão salva ou gera um QR code (acompanhe pelo status). */
export async function conectarWhatsapp(): Promise<WhatsappStatus> {
  return apiPost<WhatsappStatus>("/whatsapp/conectar", undefined, { timeoutMs: TIMEOUT_WHATSAPP_MS })
}

/** Sai do WhatsApp (remove de "Aparelhos conectados") e apaga a sessão salva. */
export async function desconectarWhatsapp(): Promise<WhatsappStatus> {
  return apiPost<WhatsappStatus>("/whatsapp/desconectar", undefined, { timeoutMs: TIMEOUT_WHATSAPP_MS })
}

export async function enviarTesteWhatsapp(telefone: string): Promise<{ telefone: string; jid: string }> {
  return apiPost<{ telefone: string; jid: string }>("/whatsapp/teste", { telefone }, { timeoutMs: TIMEOUT_WHATSAPP_MS })
}
