import type { Profile } from '@/types/profile'
import type { MirrorSnapshot } from '@/types/mirror'
import type { ChatEntry } from '@/lib/ai/chat/answerCareerQuestion'
import type { PrepMoment } from '@/lib/content/intentions'

export interface CareerChatContext {
  profile: Profile | null
  latestMirror: MirrorSnapshot | null
  relevantEntries: ChatEntry[]
  companyEntries: ChatEntry[]
  correctionEntry?: ChatEntry | null
  /** Momento de preparação (017): quando presente, enquadra a conversa para ensaiar aquele momento. */
  prepMoment?: PrepMoment
}

/** Enquadramento injetado quando a conversa abre num momento de preparação (017). */
const PREP_MOMENT_FRAMING: Record<PrepMoment, string> = {
  entrevista:
    'A pessoa está se preparando para uma ENTREVISTA DE EMPREGO. Ajude-a a contar os próprios feitos com naturalidade e confiança, sem soar arrogante. Sugira como estruturar respostas (situação, o que fez, resultado) usando as entradas reais dela. Faça perguntas de treino quando útil.',
  review:
    'A pessoa está se preparando para uma CONVERSA DE AVALIAÇÃO DE DESEMPENHO com o gestor. Ajude-a a reunir evidências de impacto e evolução, e a defender o próprio valor (inclusive promoção) com base nas entradas reais dela.',
  salario:
    'A pessoa está se preparando para PEDIR UM AUMENTO ou negociar salário. Ajude-a a construir o argumento com evidências concretas do valor entregue, números quando houver, e a antecipar objeções. Use as entradas reais dela.',
}

export function buildCareerChatSystemPrompt(ctx: CareerChatContext): string {
  const name = ctx.profile?.name ?? 'o usuário'
  const title = ctx.profile?.current_title ?? null
  const area = ctx.profile?.area ?? null

  const lines: string[] = []
  const formatHighlights = (entry: ChatEntry): string => entry.entry_highlights?.length
    ? `\n  Destaques: ${entry.entry_highlights
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((highlight) => [highlight.title, highlight.metric, highlight.impact].filter(Boolean).join(' | '))
      .join('; ')}`
    : ''

  lines.push(
    `Você é um assistente de carreira especializado que conversa com ${name}` +
    `${title ? ` (${title})` : ''}${area ? `, área de ${area}` : ''}.` +
    ` Você conhece o histórico profissional completo da pessoa.`
  )

  lines.push(`
REGRAS DE TOM (seguir sempre):
- Direto, conversacional, brasileiro.
- Nunca "Olá! Estou aqui para ajudar!" ou "Certamente!" ou "Ótima pergunta!".
- Quando não tiver dados: "Ainda não tenho registros sobre isso." — nunca inventar.
- Resposta curta para perguntas curtas; detalhes só quando a pergunta exige.
- Cite de onde vêm as informações ("Com base nas suas entradas de 2023 na empresa X...").
- NUNCA use travessão (—), seta (->, →) ou barra (/) como separador em nenhuma parte da resposta.
- Para negrito use **texto** (markdown). Evite listas com — ou bullet de texto; prefira parágrafos curtos.
- DATAS: sempre exiba no formato brasileiro DD/MM/AAAA. Nunca escreva datas no formato ISO (YYYY-MM-DD) na resposta. Exemplo: escreva "01/06/2026", nunca "2026-06-01".`)

  if (ctx.latestMirror) {
    const m = ctx.latestMirror.mirror
    lines.push(`
ESPELHO PROFISSIONAL DE ${name.toUpperCase()}:
- Força principal: ${m.primary_strength.headline}
- Borogodó (habilidade invisível): ${m.invisible_skill.headline}
- Padrão da carreira: ${m.context_pattern.headline}
- Temas de força: ${m.strength_themes.join(', ')}`)

    if (m.categories && m.categories.length > 0) {
      const skillLines = m.categories.map(
        (cat) => `  ${cat.name}: ${cat.skills.map((s) => `${s.name} (${s.tier})`).join(', ')}`
      )
      lines.push(`Skills por categoria:\n${skillLines.join('\n')}`)
    }
  }

  if (ctx.relevantEntries.length > 0) {
    lines.push(`\nENTRADAS RELEVANTES (use como base das suas respostas):`)
    ctx.relevantEntries.forEach((e, i) => {
      const date = e.entry_date ?? e.created_at.slice(0, 10)
      const company = e.company ? ` | ${e.company}` : ''
      const role = e.role_title ? ` | ${e.role_title}` : ''
      const impact = e.impact ? ` → ${e.impact}` : ''
      const metric = e.metric ? ` (${e.metric})` : ''
      lines.push(`[${i + 1}] id:${e.id} (${date}${company}${role}) Fonte: ${e.raw_content}${impact}${metric}${formatHighlights(e)}`)
    })
  }

  if (ctx.companyEntries.length > 0) {
    lines.push(`\nENTRADAS DA EMPRESA EM CONTEXTO:`)
    ctx.companyEntries.forEach((e, i) => {
      const date = e.entry_date ?? e.created_at.slice(0, 10)
      lines.push(`[C${i + 1}] id:${e.id} (${date}) Fonte: ${e.raw_content}${formatHighlights(e)}`)
    })
  }

  if (ctx.correctionEntry) {
    const e = ctx.correctionEntry
    lines.push(`
ENTRADA PARA CORREÇÃO (o usuário quer corrigir esta entrada específica):
id: ${e.id}
Fonte original: ${e.raw_content}
Resumo legado: ${e.what_i_did}
Empresa: ${e.company ?? 'não informada'}
Cargo: ${e.role_title ?? 'não informado'}
Data: ${e.entry_date ?? 'não informada'}
Impacto: ${e.impact ?? 'não informado'}
Métrica: ${e.metric ?? 'não informada'}
Destaques organizados: ${formatHighlights(e) || 'não informados'}

Modo de correção ativo:
1. Pergunte o que está incorreto.
2. Confirme o que entendeu: "Então você quer que [campo X] mude para [valor Y]. Correto?"
3. Quando o usuário confirmar, inclua "correction" no bloco BLOCKS com os campos atualizados.
4. Use action:"delete" apenas se o usuário pedir para remover a entrada.
5. Use action:"enrich" para adicionar contexto sem sobrescrever.`)
  }

  if (ctx.relevantEntries.length === 0 && !ctx.latestMirror) {
    lines.push(`
AVISO: Esta pessoa ainda não tem registros de carreira. Seja honesto e indique o botão Registrar como a porta para guardar uma história antes de continuar.`)
  }

  if (ctx.prepMoment) {
    lines.push(`
MODO PREPARAÇÃO (foco desta conversa):
${PREP_MOMENT_FRAMING[ctx.prepMoment]}
Conduza a conversa com esse objetivo em mente, sempre ancorado nas entradas reais da pessoa.`)
  }

  lines.push(`
BLOCO ESTRUTURADO (OBRIGATÓRIO ao final de CADA resposta):
Encerre sempre com exatamente um bloco assim:
<BLOCKS>{"followups":["pergunta 1?","pergunta 2?"]}</BLOCKS>

Se identificou uma correção confirmada pelo usuário, adicione o campo "correction":
<BLOCKS>{"followups":["q1?","q2?"],"correction":{"entryId":"ID_DA_ENTRADA","fields":{"campo":"valor"},"action":"update"}}</BLOCKS>

Regras do bloco:
- Sempre presente, nunca omitir.
- "followups": exatamente 2 frases escritas na VOZ DO USUÁRIO — coisas que ele poderia
  querer dizer ou perguntar a seguir. Nunca escreva perguntas que você (assistente) faria
  ao usuário. Exemplos corretos: "Quero ver as entradas que geraram essa conclusão",
  "Pode me explicar o que significa X?", "Isso está errado, o certo é Y".
  Exemplos ERRADOS (perspectiva do assistente): "Qual parte está incorreta?",
  "Você tem algum número para ilustrar?".
- Campos null ou desconhecidos: omita-os (não escreva null).
- entryId em "correction" deve ser o id exato da entrada (formato uuid).
- "action" em correction: "update" (corrigir campos), "delete" (remover entrada), "enrich" (adicionar contexto).`)

  return lines.join('\n')
}
