import type { OrganizeHighlight } from '@/lib/ai/extraction/schemas'

const RAW_TEXT_LIMIT = 8000

/**
 * Constante e estável — nunca recebe dado de usuário diretamente (mesmo padrão de
 * `CAPTURE_SYSTEM_PROMPT`). O contexto variável entra só no prompt do usuário.
 *
 * Escopo desta chamada (feature 026): infere métrica/impacto/tags/título POR DESTAQUE
 * (FR-014), e empresa/período no nível da FONTE apenas quando ainda não resolvidos
 * (FR-004/FR-006) — nunca por associação estatística entre registros, só sinal textual
 * explícito no próprio texto cru.
 */
export const CAPTURE_ORGANIZE_SYSTEM_PROMPT = `Você é a inteligência de organização do Borogodó. A pessoa já salvou um registro cru de um
momento de trabalho. Sua tarefa agora é ORGANIZAR esse texto em um ou mais DESTAQUES — não
reescrever, não resumir, não inventar.

REGRAS GERAIS:
- Um mesmo texto pode conter MAIS DE UM destaque (FR-014) — ex. uma reunião com dois resultados
  distintos vira 2 destaques, não 1 misturado. A maioria dos textos tem só 1.
- A fonte pode ser uma CONVERSA (entrevista, reunião, ligação) onde a pessoa RELATA conquistas de
  trabalhos passados — o destaque não precisa ser algo que aconteceu só NESTE momento capturado.
  Quando, dentro da conversa, a pessoa cita uma conquista concreta e específica de um projeto
  anterior com número/prova, isso é um destaque próprio — não pode desaparecer dentro de um
  resumo genérico do tipo "apresentou experiência"/"foi avaliada para a vaga".
  ERRADO (perde o resultado real dentro de um resumo genérico da conversa): texto é a transcrição
  de uma entrevista de emprego onde a pessoa menciona "implementamos essa plataforma em mais de 5
  empresas diferentes e alcançamos mais de 20.000 vidas", e o único destaque vira "Apresentação de experiência para avaliação de fit" — o resultado citado (20.000 vidas, 5 empresas) some.
  CERTO: além do destaque sobre a conversa em si (quando fizer sentido ter um), cria um destaque
  separado pra essa conquista relatada: title "Expansão de plataforma de saúde para 5 empresas,
  alcançando 20 mil vidas", metric "20.000+ vidas em 5 empresas", tags do tema (ex. healthtech,
  b2b saas).
- Cada destaque tem: title, metric, impact, tags.
  - title: substantivo-primeiro/outcome-first — o que foi ENTREGUE, com o número/prova quando
    presente no texto cru (FR-019).
    BOM: "Redução de 50% no tempo de investigação de bug crítico".
    RUIM (nominalização vaga, sem objeto concreto): "Otimização de processos".
    Uma nominalização só é aceitável quando amarrada a um objeto concreto do próprio texto cru
    (qual processo, qual resultado, qual sistema) — nunca repita o termo vago sozinho; busque o
    objeto concreto mais próximo no texto cru e inclua no título (ex.: texto fala em "otimizei o
    processo de onboarding de clientes nível X" vira "Redução do tempo de onboarding de clientes
    nível X", não "Otimização de processos" genérico).
    Uma vez que a pessoa EDITA um título manualmente, esse valor é definitivo — MUST NOT ser
    sobrescrito em nenhuma reorganização futura (FR-020, mesma regra de "só preenche vazios" de
    FR-002): por isso um destaque já existente listado em "Destaques já existentes" nunca tem seu
    title regerado, só destaques novos ganham title.
  - metric: só quando o texto TEM um número claro. Ausência de métrica é válida (FR-018) —
    nunca invente um número que não está no texto.
  - impact: consequência concreta do que foi feito, mas SÓ a que está EXPLICITAMENTE no texto
    cru — nunca infira um desdobramento futuro, uma decisão de terceiros ou uma consequência que
    "provavelmente" aconteceu. Isto é uma regra dura, não estilística: um registro pode virar
    prova em currículo ou entrevista, e uma consequência inventada vira um fato falso que a
    pessoa vai repetir como se fosse verdade.
    ERRADO (inventa uma decisão de terceiro que o texto não afirma): texto diz "o cliente ficou
    muito satisfeito e deu 5 estrelas na Clutch", e o impact vira "Cliente contratou a empresa
    para a próxima fase" — isso não foi dito, foi inferido a partir de "satisfação", e pode ser
    falso.
    CERTO: repita só o que o texto afirma ("Cliente satisfeito, avaliou o trabalho com 5 estrelas
    na Clutch") — sem extrapolar pra uma conclusão de negócio (contratação, renovação, expansão)
    que não foi mencionada.
    Regra anti-padrão de sempre: sem travessão/seta/barra, sem jargão corporativo (alavancar,
    potencializar, maximizar, otimizar, engajar, deliverar).
  - tags = skills/temas concretos. Reaproveite o VOCABULÁRIO DE TAGS já usado pela pessoa
    (ver contexto) sempre que o mesmo tema aparecer com palavras diferentes — nunca crie uma
    variação nova de uma tag que já existe no vocabulário (FR-022). Quando precisar criar uma tag
    nova (sem correspondência no vocabulário), use a MESMA capitalização e idioma das tags já
    existentes da pessoa (ex.: se o vocabulário é todo em português e minúsculas, a tag nova
    também é; nunca misture convenções dentro do vocabulário de uma mesma pessoa) (FR-023). NUNCA
    um adjetivo genérico isolado como tag (ex. "proativo", "eficiente", "importante", "difícil") —
    tag é sempre um tema/skill concreto (FR-024).

EMPRESA E PERÍODO (nível da fonte, não do destaque):
- Só infira "company" ou "entry_date" quando o pedido explicitamente pedir (isto é, quando o
  contexto abaixo disser que ainda estão vazios) — nunca por associação com outros registros.
- Baseie-se SÓ em sinal textual explícito no próprio texto (nome de empresa citado, data/período
  mencionado). Nunca invente uma correlação estatística entre este registro e outros.
- Se o texto mencionar mais de uma empresa, escolha a empresa CENTRAL ao evento descrito
  (FR-007) — a pessoa pode corrigir depois, a pílula de contexto continua editável.

SAÍDA — apenas JSON dentro de bloco de código:
\`\`\`json
{
  "highlights": [
    { "title": "...", "metric": null, "impact": "...", "tags": ["...", "..."] }
  ],
  "company": "... ou null",
  "entry_date": "YYYY-MM-DD ou null"
}
\`\`\``

interface ExistingHighlightLike {
  title: string | null
  metric: string | null
  impact: string | null
  tags: string[]
}

export interface BuildOrganizeUserPromptOptions {
  /** `company` já resolvido da fonte — omitido do pedido de inferência quando presente (FR-004/FR-006). */
  company: string | null
  /**
   * `true` quando a pessoa selecionou a pílula "Projeto pessoal" (Story 2) — contexto já
   * resolvido manualmente mesmo sem `company`; a IA MUST NOT tentar inferir uma empresa nesse
   * caso (FR-004 aplicado ao contexto, não só a `company` estar preenchida).
   */
  isPersonalProject: boolean
  /** `entry_date` já resolvido da fonte — mesma regra de omissão. */
  entryDate: string | null
  /** Vocabulário de tags já usado pela pessoa (Story 6) — reaproveitado em vez de criar variação. */
  tagVocabulary: string[]
  /** Destaques já existentes na fonte — a IA não deve tentar repeti-los. */
  existingHighlights: (OrganizeHighlight | ExistingHighlightLike)[]
}

function formatContextSection(company: string | null, isPersonalProject: boolean, entryDate: string | null): string {
  // Story 2 (FR-004): "Projeto pessoal" selecionado manualmente é contexto resolvido, mesmo com
  // `company` vazio — a IA não deve tentar inferir uma empresa por cima dessa escolha.
  const needsCompany = company === null && !isPersonalProject
  const needsEntryDate = entryDate === null

  if (!needsCompany && !needsEntryDate) {
    const companyNote = isPersonalProject
      ? 'contexto já resolvido manualmente como "Projeto pessoal"'
      : `empresa já resolvida ("${company}")`
    return `Contexto da fonte: ${companyNote} e período já resolvidos manualmente — NÃO infira nenhum dos dois, devolva "company": null e "entry_date": null.`
  }

  const asks: string[] = []
  if (needsCompany) asks.push('infira a empresa (se houver sinal textual explícito, senão null)')
  if (needsEntryDate) asks.push('infira o período (se houver sinal textual explícito, senão null)')

  const resolved: string[] = []
  if (!needsCompany) {
    const companyNote = isPersonalProject
      ? 'contexto já resolvido manualmente como "Projeto pessoal"'
      : `empresa já resolvida ("${company}")`
    resolved.push(`${companyNote} — NÃO infira, devolva "company": null`)
  }
  if (!needsEntryDate) resolved.push(`período já resolvido ("${entryDate}") — NÃO infira, devolva "entry_date": null`)

  return [`Contexto da fonte: ${asks.join(' e ')}.`, ...resolved].join(' ')
}

function formatTagVocabulary(tagVocabulary: string[]): string {
  if (tagVocabulary.length === 0) return 'Vocabulário de tags da pessoa: nenhuma ainda (primeiro registro organizado).'
  return `Vocabulário de tags da pessoa (reaproveite antes de criar uma tag nova): ${tagVocabulary.join(', ')}`
}

function formatExistingHighlights(existingHighlights: BuildOrganizeUserPromptOptions['existingHighlights']): string {
  if (existingHighlights.length === 0) return 'Destaques já existentes: nenhum ainda.'

  const list = existingHighlights
    .map((h) => `- ${h.title ?? '(sem título)'}${h.metric ? ` (${h.metric})` : ''}`)
    .join('\n')

  return `Destaques já existentes (NÃO repita, apenas adicione destaques novos se o texto trouxer algo além disso):\n${list}`
}

/** Prompt do usuário — único lugar onde dados específicos da pessoa entram na chamada. */
export function buildOrganizeUserPrompt(rawContent: string, options: BuildOrganizeUserPromptOptions): string {
  const contextSection = formatContextSection(options.company, options.isPersonalProject, options.entryDate)
  const tagSection = formatTagVocabulary(options.tagVocabulary)
  const highlightsSection = formatExistingHighlights(options.existingHighlights)

  return `Texto cru da fonte:\n---\n${rawContent.slice(0, RAW_TEXT_LIMIT)}\n---\n\n${contextSection}\n\n${tagSection}\n\n${highlightsSection}`
}
