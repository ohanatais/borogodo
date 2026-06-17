import type { AdjustKind, AngleKind, VoiceProfile } from '@/types/content'

/** Uma evidência rotulada que o modelo deve ancorar (rótulo [E1] → texto do fato). */
export interface EvidenceItem {
  label: string
  text: string
}

/** Entrada comum aos builders de user prompt dos dois formatos. */
export interface ContentPromptInput {
  /** Descrição curta do seed (nome do tema ou headline da entrada) — vira o "Baseado em:". */
  seedSummary: string
  /** Evidências que sustentam as afirmações; o modelo cita pelos rótulos em evidence_refs. */
  evidence: EvidenceItem[]
  voiceProfile: VoiceProfile | null
  /** Ângulo desejado para uma das variantes (opcional). */
  angle?: string | null
  /** Chip de ajuste que regera mantendo a evidência (opcional, US3). */
  adjust?: AdjustKind | null
  /** Tipo de ângulo do post: estudo/aprendizado ou opinião/tese (opcional, 018). */
  angleKind?: AngleKind | null
  /** Tese a defender, usada no ângulo de opinião (opcional, 018 US2). */
  thesis?: string | null
}

/**
 * Disciplina de voz herdada integralmente do `MIRROR_SYSTEM_PROMPT` (FR-009). Fonte única,
 * compartilhada pelos dois formatos para não divergir a voz entre as superfícies.
 * Livre de travessão de propósito: o prompt ensina por exemplo.
 */
export const ANTI_AI_DISCIPLINE = `DISCIPLINA DE VOZ (herdada do espelho do Borogodó; vale para tudo que você escreve aqui):

Conteúdo:
1. Toda afirmação aponta para uma evidência real da pessoa (um fato das entradas). Sem evidência,
   não afirme. Inventar fato ou número é proibido e fatal.
2. Não escreva nada que caberia em qualquer outro profissional. Se a frase serve pra todo mundo,
   corte ou reescreva com o fato específico.

Métrica é convite, nunca cobrança:
3. Muita gente boa trabalhou sem cultura de dado. Ausência de número não é fraqueza. Sem número na
   evidência, afirme pela evidência qualitativa e nunca invente o número. Quando houver número,
   sempre com janela de tempo ("de 41% para 58% em 4 trimestres"), nunca solto.

Brasilidade é substância, não enfeite:
4. Brasilidade aparece no que você enxerga como força (versatilidade na escassez, navegar
   instabilidade, técnica aprendida na marra), sempre colada ao fato. No máximo uma expressão
   brasileira de trabalho, bem colocada.
5. Proibido (brasilidade boba): gíria de elogio (mandou bem, arrasou, fera), metáfora de
   futebol/samba/carnaval, "jeitinho", emoji, diminutivo fofo, bordão de coach.

Como soar (anti-IA):
6. Nunca use travessão. Use vírgula, dois-pontos, parênteses ou ponto.
7. Antítese é proibida: nada de "não é X, é Y", "deixou de ser X, virou Y", "mais do que X, é Y".
8. Sem advérbio de ênfase vazio (exatamente, justamente, simplesmente, literalmente). Sem jargão de
   IA nem tradução do inglês (no fim das contas, em última análise, vale ressaltar, mergulhar fundo,
   destravar potencial, mover a agulha, jornada no sentido vago).
9. Sem jargão vazio de LinkedIn (humildemente animado, game changer, "comente abaixo", "bora?",
   "engaje sua audiência"). Frase curta e direta, sem redundância e sem enfeite.`

/** Contrato de saída comum aos dois formatos: exatamente 2 variantes, JSON em bloco de código. */
export const OUTPUT_CONTRACT = `SAÍDA: apenas JSON dentro de um bloco de código. Exatamente 2 variantes, cada uma com um ângulo
diferente.
- "angle": o recorte daquela variante, curto (ex: "o aprendizado", "quem participou").
- "body": o texto pronto pra colar, texto puro, sem markdown.
- "evidence_refs": os rótulos [En] das evidências que sustentam aquela variante. Se a afirmação é
  geral e não se liga a uma evidência específica, use [].

\`\`\`json
{
  "variants": [
    { "angle": "...", "body": "...", "evidence_refs": ["E1", "E3"] },
    { "angle": "...", "body": "...", "evidence_refs": ["E2"] }
  ]
}
\`\`\``

const ADJUST_INSTRUCTIONS: Record<AdjustKind, string> = {
  mais_curto: 'Reescreva mais curto, cortando o que não for essencial, sem perder a evidência.',
  menos_formal: 'Deixe o tom menos formal, mais conversado, mantendo a substância e a evidência.',
  tira_jargao: 'Remova qualquer jargão; diga as coisas de forma direta e concreta.',
}

/** Bloco de voz para o user prompt. Sem perfil, instrui um tom neutro-brasileiro padrão (FR edge). */
export function buildVoiceBlock(voice: VoiceProfile | null): string {
  if (!voice) {
    return 'Voz: ainda não há perfil. Use um tom neutro-brasileiro, direto e caloroso, sem jargão.'
  }

  const parts: string[] = []
  if (voice.inferredSummary) {
    parts.push(`Síntese da voz (inferida do que a pessoa escreveu): ${voice.inferredSummary}`)
  }
  if (voice.tone) parts.push(`Tom preferido: ${voice.tone}`)
  if (voice.lengthPref) parts.push(`Comprimento preferido: ${voice.lengthPref}`)
  if (voice.samples.length > 0) {
    const samples = voice.samples.map((s, i) => `[A${i + 1}] ${s}`).join('\n')
    parts.push(`Amostras da escrita da pessoa (espelhe o ritmo e o vocabulário, não copie):\n${samples}`)
  }

  if (parts.length === 0) {
    return 'Voz: perfil vazio. Use um tom neutro-brasileiro, direto e caloroso, sem jargão.'
  }

  return parts.join('\n')
}

/** Bloco de evidência. Base limitada não autoriza inventar fato (edge case da spec). */
export function buildEvidenceBlock(evidence: EvidenceItem[]): string {
  if (evidence.length === 0) {
    return 'Evidência: base limitada. Não invente fato para preencher; afirme só o que houver.'
  }

  return evidence.map((e) => `[${e.label}] ${e.text}`).join('\n')
}

/** Bloco de ajuste (chip da US3). Vazio quando não há ajuste. */
export function buildAdjustBlock(adjust?: AdjustKind | null): string {
  if (!adjust) return ''
  return `\n\nAJUSTE PEDIDO: ${ADJUST_INSTRUCTIONS[adjust]}`
}

const STUDY_ANGLE_INSTRUCTION = `ÂNGULO: Estudo. Conte algo que você estudou ou aprendeu, ancorado na evidência real (o que você
fez de fato). O foco é o aprendizado concreto, não a auto-bajulação: o que mudou no seu jeito de
pensar ou fazer, sempre colado a um fato das suas entradas. Nada de lição genérica de coach.`

/**
 * Bloco de ângulo do post (018). Vazio para o ângulo padrão (relato). Estudo reorienta as duas
 * variantes para o aprendizado ancorado na evidência. Opinião (US2) será adicionado na Phase 4.
 */
export function buildAngleBlock(input: ContentPromptInput): string {
  if (input.angleKind === 'study') {
    return `\n\n${STUDY_ANGLE_INSTRUCTION}`
  }
  return ''
}
