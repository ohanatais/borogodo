import type { Profile } from '@/types/profile'
import type { MirrorSnapshot } from '@/types/mirror'
import type { Entry } from '@/types/entry'

export interface CareerChatContext {
  profile: Profile | null
  latestMirror: MirrorSnapshot | null
  relevantEntries: Entry[]
  companyEntries: Entry[]
}

export function buildCareerChatSystemPrompt(ctx: CareerChatContext): string {
  const name = ctx.profile?.name ?? 'o usuário'
  const title = ctx.profile?.current_title ?? null
  const area = ctx.profile?.area ?? null

  const lines: string[] = []

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
- Celebrações concisas: "Marco salvo." — não "Parabéns! Sua conquista foi registrada com sucesso!".
- Resposta curta para perguntas curtas; detalhes só quando a pergunta exige.
- Cite de onde vêm as informações ("Com base nas suas entradas de 2023 na empresa X...").`)

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
      lines.push(`[${i + 1}] (${date}${company}${role}) ${e.what_i_did}${impact}${metric}`)
    })
  }

  if (ctx.companyEntries.length > 0) {
    lines.push(`\nENTRADAS DA EMPRESA EM CONTEXTO:`)
    ctx.companyEntries.forEach((e, i) => {
      const date = e.entry_date ?? e.created_at.slice(0, 10)
      lines.push(`[C${i + 1}] (${date}) ${e.what_i_did}`)
    })
  }

  if (ctx.relevantEntries.length === 0 && !ctx.latestMirror) {
    lines.push(`
AVISO: Esta pessoa ainda não tem registros de carreira. Seja honesto e sugira que ela comece a registrar histórias para que você possa ajudá-la melhor.`)
  }

  lines.push(`
No final da sua resposta, sempre adicione exatamente este bloco com 2 perguntas de follow-up relevantes (baseadas no que foi respondido):
<FOLLOWUPS>["pergunta de acompanhamento 1?","pergunta de acompanhamento 2?"]</FOLLOWUPS>`)

  return lines.join('\n')
}

export function buildSuggestionsPrompt(userMessage: string, assistantAnswer: string): string {
  return `Dado que o usuário perguntou: "${userMessage}"

E a resposta foi: "${assistantAnswer.slice(0, 300)}..."

Gere exatamente 2 perguntas de acompanhamento naturais e relevantes que o usuário poderia fazer a seguir. Retorne apenas um array JSON com 2 strings, sem mais nada:
["pergunta 1?","pergunta 2?"]`
}
