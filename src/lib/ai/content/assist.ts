import { complete as defaultComplete } from '@/lib/ai/client'
import type { LLMRequest } from '@/lib/ai/provider'
import { validateContentRuleset } from '@/lib/ai/content/validateRuleset'
import { ANTI_AI_DISCIPLINE } from '@/lib/ai/content/prompts/discipline'

/** Chamada de LLM injetável — default usa o client real; testes passam um mock. */
export type CompleteFn = (req: LLMRequest) => Promise<string>

export type AssistMode = 'rephrase' | 'unblock' | 'star_nudge'
export type AssistSection = 'entregas' | 'impacto' | 'evolucao' | 'pontos_a_desenvolver'

export interface AssistInput {
  mode: AssistMode
  section: AssistSection
  /** A frase que a PESSOA escreveu (rephrase / star_nudge). */
  text?: string
  /** Período em edição, para ancorar a pergunta do unblock. */
  seedRef?: string
}

export type AssistResult =
  | { mode: 'rephrase'; suggestion: string }
  | { mode: 'unblock'; question: string }
  | { mode: 'star_nudge'; prompt: string | null }

/** Saída do LLM violou a disciplina anti-IA após 1 retry → degrada (a rota mapeia 422, não bloqueia). */
export class AssistFailedError extends Error {
  constructor(reason: string) {
    super(reason)
    this.name = 'AssistFailedError'
  }
}

const MAX_TOKENS = 512

// ─── star_nudge: heurística determinística (sem LLM, sem custo, sem invenção) ────────────────────
const HAS_NUMBER_RE = /\d/
const HAS_RESULT_RE = /(resultado|de\s.+\spara\s|aument|reduz|cresc|dobr|%|R\$)/i
/** Default não-localizado; a UI exibe `autoavaliacao.assist.starNudge` (i18n). Nunca propõe o número. */
const STAR_NUDGE_PROMPT = 'qual foi o resultado / número / antes-depois?'

/** Detecta afirmação vaga sem número nem resultado — só sinaliza, jamais preenche. */
function needsStarNudge(text: string): boolean {
  return !HAS_NUMBER_RE.test(text) && !HAS_RESULT_RE.test(text)
}

// ─── rephrase / unblock: Sonnet (role 'synthesis'), com guarda anti-IA + 1 retry ────────────────
const REPHRASE_SYSTEM = `${ANTI_AI_DISCIPLINE}

Você recebe um trecho que a pessoa escreveu sobre o próprio trabalho e devolve uma versão MELHOR na voz
dela: mais clara, direta e bem montada, cortando redundância, enrolação e repetição, e deixando cada
afirmação mais nítida. Regras inegociáveis: não invente nem adicione nenhum fato, número, projeto ou
afirmação que não esteja no texto original; não infle nem enfeite; mantenha TODOS os fatos e o tom da
pessoa. Se o texto já estiver bom, faça só os ajustes que de fato melhoram, sem reescrever por
reescrever. Devolva apenas o texto reescrito, em texto puro, sem aspas e sem explicação.`

const UNBLOCK_SYSTEM = `${ANTI_AI_DISCIPLINE}

A pessoa não sabe por onde começar uma seção da própria autoavaliação. Faça UMA pergunta curta que a
ajude a lembrar e a escrever com as próprias palavras. Não escreva a autoavaliação por ela, não afirme
nada, não dê nota. Devolva apenas a pergunta.`

const SECTION_LABEL: Record<AssistSection, string> = {
  entregas: 'entregas',
  impacto: 'impacto',
  evolucao: 'evolução',
  pontos_a_desenvolver: 'pontos a desenvolver',
}

const RETRY_FEEDBACK =
  '\n\nA resposta anterior violou as regras de voz (ex: travessão, jargão de IA). Reescreva corrigindo, sem adicionar nenhum fato novo.'

/** Roda o LLM e valida a saída pelo ruleset anti-IA; regenera UMA vez; degrada com AssistFailedError. */
async function runWithRuleset(req: LLMRequest, complete: CompleteFn): Promise<string> {
  const first = (await complete(req)).trim()
  if (validateContentRuleset(first).length === 0) return first

  const second = (await complete({ ...req, user: req.user + RETRY_FEEDBACK })).trim()
  if (validateContentRuleset(second).length === 0) return second

  throw new AssistFailedError('ruleset')
}

/**
 * Assistência não-invasiva à escrita da autoavaliação (019, US1, research D3). NUNCA gera o bloco nem
 * dá nota: `rephrase` reformula só o que a pessoa escreveu; `unblock` faz 1 pergunta (a resposta dela
 * vira o rascunho); `star_nudge` só sinaliza a ausência de impacto. A pessoa aceita/rejeita/edita.
 */
export async function assist(
  input: AssistInput,
  complete: CompleteFn = defaultComplete
): Promise<AssistResult> {
  if (input.mode === 'star_nudge') {
    return { mode: 'star_nudge', prompt: needsStarNudge(input.text ?? '') ? STAR_NUDGE_PROMPT : null }
  }

  if (input.mode === 'rephrase') {
    const suggestion = await runWithRuleset(
      { role: 'synthesis', system: REPHRASE_SYSTEM, user: `Trecho da pessoa:\n${input.text ?? ''}`, maxTokens: MAX_TOKENS },
      complete
    )
    return { mode: 'rephrase', suggestion }
  }

  const question = await runWithRuleset(
    {
      role: 'synthesis',
      system: UNBLOCK_SYSTEM,
      user: `Seção: ${SECTION_LABEL[input.section]}. Período: ${input.seedRef ?? 'não informado'}.`,
      maxTokens: MAX_TOKENS,
    },
    complete
  )
  return { mode: 'unblock', question }
}
