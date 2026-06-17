// Parser leve do body da autoavaliação (019, US1). O motor emite quatro seções nomeadas com rótulos
// literais ("Entregas:", "Impacto:", "Evolução:", "Pontos a desenvolver:"). Aqui detectamos esses
// cabeçalhos no texto e os transformamos em blocos, para o DraftCard renderizar por seções em vez de
// texto corrido. Só apresentação: o body completo continua a fonte da verdade (edição/cópia usam-no).

export interface SelfAssessmentSection {
  /** Chave i18n da seção em `autoavaliacao.sections`, quando o cabeçalho é reconhecido. */
  key: 'entregas' | 'impacto' | 'evolucao' | 'pontosADesenvolver' | null
  /** Rótulo cru detectado no texto (fallback quando `key` é null). */
  rawLabel: string
  body: string
}

/** Rótulos literais do prompt → chave i18n. Acentos e caixa importam; normalizamos antes de comparar. */
const LABEL_TO_KEY: ReadonlyArray<{ label: string; key: SelfAssessmentSection['key'] }> = [
  { label: 'entregas', key: 'entregas' },
  { label: 'impacto', key: 'impacto' },
  { label: 'evolução', key: 'evolucao' },
  { label: 'evolucao', key: 'evolucao' },
  { label: 'pontos a desenvolver', key: 'pontosADesenvolver' },
]

function resolveKey(rawLabel: string): SelfAssessmentSection['key'] {
  const normalized = rawLabel.trim().toLowerCase()
  return LABEL_TO_KEY.find((entry) => entry.label === normalized)?.key ?? null
}

/**
 * Quebra o body em seções a partir de cabeçalhos do tipo `Rótulo:` no início de uma linha. Texto que
 * antecede o primeiro cabeçalho (ou ausência total de cabeçalhos) volta como uma única seção sem
 * rótulo — nunca perdemos conteúdo. Imutável.
 */
export function parseSelfAssessmentSections(body: string): SelfAssessmentSection[] {
  const lines = body.split('\n')
  const sections: SelfAssessmentSection[] = []
  let current: SelfAssessmentSection | null = null

  const headerPattern = /^\s*([\p{L} ]{2,40}?):\s*(.*)$/u

  for (const line of lines) {
    const match = line.match(headerPattern)
    const key = match ? resolveKey(match[1]) : null

    if (match && key) {
      current = { key, rawLabel: match[1].trim(), body: match[2] }
      sections.push(current)
      continue
    }

    if (!current) {
      current = { key: null, rawLabel: '', body: line }
      sections.push(current)
      continue
    }

    current.body = current.body ? `${current.body}\n${line}` : line
  }

  return sections.map((section) => ({ ...section, body: section.body.trim() }))
}
