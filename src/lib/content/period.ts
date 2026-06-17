// Codificação da chave de um seed de período (019, US1). Um período não é uma linha de tabela: é a
// agregação das entradas de um intervalo de datas. Como o `seedRef` é um único texto, encodamos
// `from` + `to` aqui — e só aqui — para servidor (loadSeed) e cliente compartilharem a mesma forma.
// Espelha `projectSeed.ts`: separador literal ':::' e prefixo literal 'period'.

const PERIOD_SEED_SEPARATOR = ':::'
const PERIOD_SEED_PREFIX = 'period'
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const MONTHS_PER_CYCLE = 6

export type PeriodPreset = 'este_ano' | 'ultimo_ciclo'

/** `true` se `value` é uma data ISO `YYYY-MM-DD` real (rejeita `2025-13-99`). */
function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

/** Formata uma `Date` (em UTC) como `YYYY-MM-DD`. */
function formatIsoDate(date: Date): string {
  const year = String(date.getUTCFullYear()).padStart(4, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function serializePeriodSeedRef(from: string, to: string): string {
  return `${PERIOD_SEED_PREFIX}${PERIOD_SEED_SEPARATOR}${from}${PERIOD_SEED_SEPARATOR}${to}`
}

export function parsePeriodSeedRef(seedRef: string): { from: string; to: string } | null {
  const parts = seedRef.split(PERIOD_SEED_SEPARATOR)
  if (parts.length !== 3) return null

  const [prefix, from, to] = parts
  if (prefix !== PERIOD_SEED_PREFIX) return null
  if (!isValidIsoDate(from) || !isValidIsoDate(to)) return null
  if (from > to) return null

  return { from, to }
}

export function resolvePeriodPreset(preset: PeriodPreset, now: Date): { from: string; to: string } {
  const to = formatIsoDate(now)

  if (preset === 'este_ano') {
    const from = `${String(now.getUTCFullYear()).padStart(4, '0')}-01-01`
    return { from, to }
  }

  const fromDate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - MONTHS_PER_CYCLE, now.getUTCDate())
  )
  return { from: formatIsoDate(fromDate), to }
}
