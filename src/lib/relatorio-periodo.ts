/**
 * Datas do relatório de SATs: sempre dias de Brasília no formato AAAA-MM-DD
 * (mesmas regras do backend em src/relatorio/relatorio-periodo.util.ts).
 */

const FUSO = "America/Sao_Paulo"
export const MAX_DIAS_PERIODO = 366

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

const pad2 = (n: number) => String(n).padStart(2, "0")

/** Hoje em Brasília (AAAA-MM-DD), independente do fuso do navegador */
export function hojeSaoPaulo(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

/** Mês atual em Brasília (AAAA-MM) */
export function mesAtualSaoPaulo(): string {
  return hojeSaoPaulo().slice(0, 7)
}

/** Mês anterior ao atual em Brasília (AAAA-MM) — padrão do relatório mensal */
export function mesAnteriorSaoPaulo(): string {
  const [ano, mes] = mesAtualSaoPaulo().split("-").map(Number)
  return mes === 1 ? `${ano - 1}-12` : `${ano}-${pad2(mes - 1)}`
}

function ultimoDiaDoMes(ano: number, mes: number): number {
  return new Date(Date.UTC(ano, mes, 0)).getUTCDate()
}

/** Primeiro e último dia de um mês (AAAA-MM). O mês atual vai só até hoje. */
export function periodoDoMes(anoMes: string): { inicio: string; fim: string } {
  const [ano, mes] = anoMes.split("-").map(Number)
  const fim = `${anoMes}-${pad2(ultimoDiaDoMes(ano, mes))}`
  const hoje = hojeSaoPaulo()
  return { inicio: `${anoMes}-01`, fim: fim > hoje ? hoje : fim }
}

/** Mensagem de erro do período (mesmas regras do backend) ou null se estiver ok */
export function validarPeriodo(inicio: string, fim: string): string | null {
  if (!inicio || !fim) return "Informe a data inicial e a data final."
  if (inicio > fim) return "A data inicial deve ser anterior ou igual à data final."
  const dias = (Date.parse(`${fim}T00:00:00Z`) - Date.parse(`${inicio}T00:00:00Z`)) / 86_400_000 + 1
  if (dias > MAX_DIAS_PERIODO) return `O período deve ter no máximo ${MAX_DIAS_PERIODO} dias.`
  if (fim > hojeSaoPaulo()) return "A data final não pode ser posterior a hoje."
  return null
}

/** 'AAAA-MM-DD' → 'dd/mm/aaaa' */
export function formatarDataBR(data: string): string {
  const [ano, mes, dia] = data.slice(0, 10).split("-")
  return `${dia}/${mes}/${ano}`
}

/** Instante ISO → 'dd/mm/aaaa hh:mm' em Brasília */
export function formatarDataHoraBR(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    timeZone: FUSO,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** Instante ISO → 'dd/mm/aaaa' em Brasília */
export function formatarDataCurtaBR(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: FUSO })
}

function mesesCompletos(inicio: string, fim: string): number | null {
  const [ai, mi, di] = inicio.split("-").map(Number)
  const [af, mf, df] = fim.split("-").map(Number)
  if (di !== 1 || df !== ultimoDiaDoMes(af, mf)) return null
  return af * 12 + mf - (ai * 12 + mi) + 1
}

/** 'Setembro/2026', 'Julho a Setembro/2026' ou '10/09/2026 a 24/09/2026' */
export function rotuloPeriodo(inicio: string, fim: string): string {
  const meses = mesesCompletos(inicio, fim)
  const [ai, mi] = inicio.split("-").map(Number)
  const [af, mf] = fim.split("-").map(Number)
  if (meses === 1) return `${MESES[mi - 1]}/${ai}`
  if (meses !== null) {
    return ai === af
      ? `${MESES[mi - 1]} a ${MESES[mf - 1]}/${af}`
      : `${MESES[mi - 1]}/${ai} a ${MESES[mf - 1]}/${af}`
  }
  return inicio === fim ? formatarDataBR(inicio) : `${formatarDataBR(inicio)} a ${formatarDataBR(fim)}`
}

/** 'Setembro/2026 (01/09/2026 a 30/09/2026)' ou, para períodos personalizados, só as datas */
export function descreverPeriodo(inicio: string, fim: string): string {
  const rotulo = rotuloPeriodo(inicio, fim)
  return mesesCompletos(inicio, fim) === null
    ? rotulo
    : `${rotulo} (${formatarDataBR(inicio)} a ${formatarDataBR(fim)})`
}

/** Mesmo nome do PDF anexado ao e-mail */
export function nomeArquivoPdf(inicio: string, fim: string): string {
  const meses = mesesCompletos(inicio, fim)
  if (meses === 1) return `Relatorio_SATs_${inicio.slice(0, 7)}.pdf`
  if (meses !== null) return `Relatorio_SATs_${inicio.slice(0, 7)}_a_${fim.slice(0, 7)}.pdf`
  if (inicio === fim) return `Relatorio_SATs_${inicio}.pdf`
  return `Relatorio_SATs_${inicio}_a_${fim}.pdf`
}

/** 'Setembro/2026' para um mês AAAA-MM */
export function rotuloMes(anoMes: string): string {
  const [ano, mes] = anoMes.split("-").map(Number)
  return `${MESES[mes - 1]}/${ano}`
}
