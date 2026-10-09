/**
 * Telefones de WhatsApp no formato E.164 sem o "+" (ex.: 5511999998888).
 * Mesmas regras do backend em src/whatsapp/telefone.util.ts.
 */

const DDI_BRASIL = "55"

/**
 * Normaliza um telefone digitado. Retorna null quando inválido.
 * - Com "+": internacional, 10 a 15 dígitos.
 * - Sem "+": brasileiro — DDD + número (10 ou 11 dígitos, com ou sem zero inicial) ou já com o 55.
 */
export function normalizarTelefone(entrada: string): string | null {
  const texto = entrada.trim()
  if (!texto) return null

  const internacional = texto.startsWith("+")
  let digitos = texto.replace(/\D/g, "")

  if (internacional) return /^\d{10,15}$/.test(digitos) ? digitos : null

  digitos = digitos.replace(/^0+/, "")
  if (/^\d{10,11}$/.test(digitos)) return `${DDI_BRASIL}${digitos}`
  if (/^55\d{10,11}$/.test(digitos)) return digitos
  return null
}

/** 5511999998888 → '+55 (11) 99999-8888'; outros países → '+<dígitos>'. */
export function formatarTelefoneBR(telefone: string): string {
  const m = /^55(\d{2})(\d{4,5})(\d{4})$/.exec(telefone)
  if (!m) return `+${telefone}`
  return `+55 (${m[1]}) ${m[2]}-${m[3]}`
}

/** Texto digitado parece um telefone (e não um e-mail)? */
export function pareceTelefone(texto: string): boolean {
  return !texto.includes("@") && /\d{8,}/.test(texto.replace(/\D/g, ""))
}
