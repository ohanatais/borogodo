# Golden set de voz — guardrail de regressão (015)

O **golden set** trava a regressão da voz do bloco de Geração de Conteúdo (post, resumo de impacto,
mini-bio). É um **gate obrigatório do CI**: roda a cada PR para `main`/`develop` e bloqueia o merge se
uma regra anti-IA enfraquecer ou um exemplo-ouro parar de passar.

## O que ele garante (e o que não garante)

**Garante**, de forma determinística e sem custo:

- As **10 regras anti-IA** (`validateContentRuleset`) continuam pegando cada classe de violação
  (travessão, antítese, clichê de bio, etc.). Se alguém afrouxar o ruleset, os "casos ruins" falham.
- Os **exemplos-ouro** (saídas representativas dos 3 formatos) continuam limpos pelo ruleset e válidos
  pelo schema. Se a forma esperada mudar, eles falham.
- A **meta-regressão**: um corpo bom degradado (travessão / clichê de bio) passa a violar — prova que o
  guardrail morde de fato.

**Não garante** (de propósito):

- Não chama a IA de verdade. As saídas de LLM usadas são **fixtures mockadas**, não geração ao vivo.
  Isso evita custo e flakiness no CI (LLM-judge ao vivo é trabalho futuro, fora do escopo da 015).
- Logo, ele **não** julga a qualidade da saída real do modelo a cada PR. Ele é uma **rede de regressão
  das regras e dos exemplos**, não um juiz de IA.

## A regra de ouro para quem mexe em prompt

Mudou um prompt do bloco (`prompts/post.ts`, `impactSummary.ts`, `miniBio.ts`, `recalibrate.ts`,
`discipline.ts`) ou o ruleset? **O golden set tem que ficar verde.** Se a mudança quebrar uma regra ou
sujar um exemplo-ouro, o CI bloqueia — conserte o prompt, não afrouxe o teste. Se a mudança for
legítima e alterar a forma esperada, atualize as fixtures conscientemente no mesmo PR.

## Onde

- Regras: `src/lib/ai/content/validateRuleset.ts` + `bannedTerms.ts`
- Fixtures e harness: `src/lib/ai/content/__tests__/fixtures/goldenSet.ts` + `goldenSet.test.ts`
- Gate de CI: step **"Golden set (guardrail de voz)"** em `.github/workflows/ci.yml` (à parte do
  `npm test`, para nunca ser pulado em silêncio).
