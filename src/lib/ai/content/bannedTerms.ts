// Lista centralizada de termos/padrões anti-IA para a Geração de Conteúdo (013).
//
// Decisão de implementação (T007): mantida SEPARADA da lista do espelho
// (`src/lib/ai/mirror/validateRuleset.ts`), que já está testada e estável. Refatorar aquele
// módulo só para extrair um `bannedTerms` compartilhado introduziria risco de regressão sem
// ganho hoje (YAGNI). As regras de voz são idênticas por intenção; se as duas listas divergirem
// no futuro, extrair um módulo comum passa a valer a pena.

/** Assert 2 — buzzwords genéricas de IA/corporativês. */
export const BANNED_BUZZWORDS: readonly RegExp[] = [
  /data[-\s]driven/i,
  /orientad[ao]\s+a\s+resultados/i,
  /proativ[ao]/i,
  /sinergia/i,
  /disruptiv[ao]/i,
  /escal[aá]vel/i,
  /alavancar/i,
  /\bjornada\b/i,
  /transforma\s+ambiguidade/i,
]

/** Assert 3 — padrões de antítese ("não é X, é Y" / "deixou de ser X" / "mais do que X, é Y"). */
export const ANTITHESIS_PATTERNS: readonly RegExp[] = [
  /deixou\s+de\s+ser/i,
  /n[ãa]o\s+[eé]\s+.{1,60}?,\s*[eé]\s/i,
  /mais\s+do\s+que\s+.{1,60}?,\s*[eé]\s/i,
]

/** Assert 4 — advérbios de ênfase vazios. */
export const EMPHASIS_ADVERBS: readonly RegExp[] = [
  /\bexatamente\b/i,
  /\bjustamente\b/i,
  /\bsimplesmente\b/i,
  /\bliteralmente\b/i,
  /\bbasicamente\b/i,
]

/** Assert 5 — jargão de IA / tradução literal do inglês. */
export const AI_JARGON: readonly RegExp[] = [
  /mover\s+a\s+agulha/i,
  /destravar\s+(?:o\s+)?potencial/i,
  /desbloquear\s+(?:o\s+)?potencial/i,
  /mergulhar\s+fundo/i,
  /no\s+fim\s+das\s+contas/i,
  /em\s+[uú]ltima\s+an[aá]lise/i,
  /vale\s+ressaltar/i,
  /[eé]\s+importante\s+notar/i,
  /ao\s+final\s+do\s+dia/i,
]

/** Assert 6 — jargão vazio de LinkedIn. */
export const LINKEDIN_JARGON: readonly RegExp[] = [
  /humildemente\s+animad[ao]/i,
  /game\s+changer/i,
  /comente\s+abaixo/i,
  /deixa\s+nos\s+coment[aá]rios/i,
  /marque\s+algu[eé]m/i,
  /\bbora\?/i,
  /concordam\?/i,
]

/** Assert 8 — gíria de elogio. */
export const PRAISE_SLANG: readonly RegExp[] = [
  /mandou\s+bem/i,
  /arrasou/i,
  /t[aá]\s+voando/i,
  /\bfera\b/i,
  /mitou/i,
]

/** Assert 9 — brasilidade boba (metáfora de futebol/samba/carnaval, "jeitinho", diminutivos fofos). */
export const SILLY_BRAZILIANISM: readonly RegExp[] = [
  /jeitinho/i,
  /gol\s+de\s+placa/i,
  /\bdrible\b/i,
  /\bsamba\b/i,
  /carnaval/i,
  /forcinha/i,
  /projetinho/i,
  /textinho/i,
  /probleminha/i,
]

/** Assert 9 — emoji decorativo (qualquer pictografia). */
export const EMOJI_RE = /\p{Extended_Pictographic}/u

/**
 * Assert 10 (015) — clichê de bio de LinkedIn. É o formato onde o clichê é mais forte e mais datado;
 * sem a regra, a mini-bio (e qualquer texto) soa genérica. Vale para todos os formatos: "apaixonado
 * por tecnologia" é vazio num post tanto quanto numa bio. Escopado a frases inequívocas de auto-bio
 * para não acusar texto concreto (uma bio factual sobre o que a pessoa fez não dispara nenhuma).
 */
export const BIO_CLICHES: readonly RegExp[] = [
  /apaixonad[oa]\s+por/i,
  /paix[ãa]o\s+por\s+(?:tecnologia|produto|inova[çc][ãa]o|dados|design|pessoas)/i,
  /transformand[oa]?\s+ideias\s+em\s+realidade/i,
  /movid[oa]\s+(?:a|por)\s+(?:desafios|resultados)/i,
  /em\s+busca\s+(?:de|por)\s+(?:novos\s+)?desafios/i,
  /entusiasta\s+d[aeo]/i,
  /profissional\s+(?:dedicad|movid|apaixonad|focad|orientad|comprometid|versátil|versatil)/i,
  /resultados\s+que\s+falam\s+por\s+si/i,
  /sempre\s+(?:em\s+busca\s+de\s+(?:aprendizado|conhecimento|crescimento)|aprendendo)/i,
]

/**
 * Assert 7 — métrica de mudança (percentual ou "de X para Y"). Quando presente sem janela de
 * tempo, soa como número solto/cobrança. Escopado ao caso canônico da marca ("de 41% para 58%
 * em 4 trimestres") para alta precisão e baixo falso-positivo; pode evoluir com saídas reais.
 */
export const METRIC_CHANGE_RE =
  /de\s+\d[\d.,]*\s*%?\s+(?:para|pra)\s+\d|(?:aument|reduz|cresc|caiu|\bcai\b|subiu|dobr|triplic|cort|economiz)\w*[^.]*?\d[\d.,]*\s*%/i

/** Assert 7 — janela de tempo que legitima a métrica. */
export const TIME_WINDOW_RE =
  /\b(trimestres?|m[êe]s|meses|semanas?|dias?|anos?|horas?|d[ée]cadas?|nos?\s+[úu]ltim|por\s+(?:m[êe]s|ano|semana|dia)|ao\s+(?:m[êe]s|ano|dia)|durante|desde)\b|em\s+\d/i
