# 002 — Freio de custo de IA agora, monetização adiada

- **Data:** 2026-06-22
- **Status:** decidido
- **Objetivo core que isso serve:** sobrevivência (não sangrar a conta de IA) sem desviar o foco de agora, que é retenção/aha. Receita fica registrada como hipótese, não como obra.

## Contexto

Hoje não existe nenhum controle de custo de IA no Borogodó (verificado no código: toda
chamada paga passa por `getProvider().complete()` em `src/lib/ai/provider.ts`, sem rate
limit, quota, plano ou billing). As issues [#31](https://github.com/ohanatais/borogodo/issues/31)
(rate limit + teto de custo) e [#39](https://github.com/ohanatais/borogodo/issues/39)
(monetização freemium) vinham tratadas como um pacote acoplado.

Preço real dos modelos (jun/2026): Haiku 4.5 = US$1/US$5 por milhão de tokens (in/out);
Sonnet 4.6 = US$3/US$15. Em custo por ação: uma **geração Sonnet** (espelho, post,
autoavaliação) ≈ **US$0,05**; uma **captura Haiku** ≈ **US$0,01** — diferença de ~5x.

O lançamento será **beta controlado, sem chuva de gente**. Logo a exposição financeira real
no início é de **dezenas de dólares/mês** (~25 usuários × ~50 gerações × US$0,05 ≈ US$60/mês),
não uma sangria. O `/product-north stress` derrubou o escopo grande de #31 (medidor por ação +
quota + instrumentação de pricing) como prematuro: resolve uma escala que o plano de
lançamento não tem.

## Decisão

**Desacoplar as duas issues.** Agora só o **freio mínimo invisível** (#31). Cobrança e cota
mensal ficam adiadas até o produto provar retenção (#39 vira hipótese registrada, não obra).

### Regras de negócio — o que entra agora (#31)

1. **Captura/registros: sem limite.** Texto, PDF, áudio, criação de registro. É barato (Haiku)
   e é o moat (o input). Nunca limita.
2. **Limite por hora nas ações caras (anti-robô):** espelho, post, autoavaliação, chat — no
   máximo *X por hora* por usuário (ex: 10). Humano normal nunca encosta; barra script/bot.
3. **Trava geral de gasto diário (rede de segurança):** se o gasto total de IA do dia passar de
   um valor configurável (**US$10**), o sistema segura e avisa **a Ohana**. Protege contra bug
   em loop. Não aparece pro usuário.
4. **Mensagem honesta e gentil ao esbarrar num limite:** nunca corte seco, erro feio ou
   silêncio. Tom da marca ("você tá usando bastante, que bom — espera uns minutinhos").

> **Refino na clarificação da spec (sessão 2026-06-27, `specs/023-freio-de-custo`):** o teto
> diário caiu de US$20 → **US$10** (lançamento controlado, pouco uso esperado). E o "avisa a
> Ohana" virou **dois e-mails para admin@borogodo.ai**: um **preventivo** ao cruzar um limiar
> *antes* do teto (~70%), e outro ao **atingir** o teto. Os e-mails trazem retrato operacional do
> dia: nº de usuários ativos, ranking de quem mais consome e quais usuários estão travados pelo
> limite por hora.

### O que NÃO entra agora

- Sem cobrança (preço, cartão, plano pago). Beta é grátis.
- Sem cota mensal por usuário (ex: "30 posts/mês"). Ninguém sente teto mensal no beta.
- Sem contagem de uso por ação **para pesquisar preço (pricing)**. Isso fica pra quando existir
  plano pago.

> **Ampliação consciente (sessão 2026-06-27):** rastrear **gasto de IA por usuário** entra agora,
> mas por propósito **operacional** (alimentar o ranking de consumo e a lista de "quem está
> travado" nos e-mails de alerta — rodar o beta com segurança), **não** para calibrar preço. A
> medição *para pricing* segue adiada junto da #39. A distinção é de finalidade: operação ≠
> precificação.

### Decisão de monetização — registrada, não construída (#39)

- **Quando virar pago, o modelo será assinatura** (valor fixo mensal/anual em BRL), **não
  por-uso (metered)**.
- **A cobrança trava a geração** (Sonnet: espelho/post/autoavaliação), **nunca a captura**
  (Haiku: o moat).
- **Anual** pra cortar o churn do episódico ("assino antes do review, cancelo depois").
- **Só construir a máquina de cobrança quando o produto provar retorno episódico** — não antes.
- B2B (bootcamps/coaches/empresas) = receita maior, mas outro produto/ciclo. Depois.

## Alternativas consideradas

- **A — Construir tudo agora (medidor por ação + quota + Stripe + planos).** Leitura literal das
  issues. Descartada: semanas de billing pra um produto que ainda vai mudar de forma; define
  limites de plano no escuro.
- **B — Só teto burro, mínimo.** Resolve sobrevivência mas não vira fundação de nada.
- **C — Medidor agora como fundação + cobrança adiada.** Era a recomendação inicial; o `stress`
  a encolheu: o medidor por ação e a instrumentação de pricing são prematuros num beta de
  dezenas de dólares de exposição.
- **D — Freio mínimo (rate-limit por hora + kill-switch de gasto) + monetização registrada.**
  **← escolhida.** Mata os dois riscos reais (bug em loop, script) numa tarde, e libera o tempo
  pra fechar a 019 e validar o aha.

Sobre o modelo de cobrança: **assinatura (escolhida)** vs **por-uso/PostHog (descartada)** vs
**pacotes/"pague pelo momento" (hipótese secundária)**.

## Por que esta (e o steelman do oposto)

Por-uso (PostHog) **parece** certo porque o nosso *custo* é por-uso — mas o valor pro usuário é
**episódico** (entrevista, review, um post forte), não proporcional ao volume. O custo ser
por-uso é problema nosso pra absorver/limitar, não preço pra repassar. E metered **tributa o
momento de ansiedade** (a pessoa prepara uma entrevista vendo o contador subir). B2C individual
ganha com previsibilidade (assinatura); por-uso ganha em B2B/devtools, que não é o caso agora.

Steelman do oposto (cobrar já): preço é posicionamento; lançar grátis pode treinar o usuário a
nunca pagar e migrar billing com usuários vivos dói. Por que ainda assim adiar: pré-PMF, o
gargalo é o aha emocionar e a pessoa voltar — não a disposição a pagar. Sem retorno episódico
validado, qualquer limite/cota é fé, e a porta do preço continua aberta pra ligar depois.

## Riscos e o que os mitiga

1. **Sobre-engenharia (alta)** → mitigado encolhendo #31 pro par rate-limit + kill-switch. Nada
   de medidor/quota agora.
2. **Custo de oportunidade vs 019/aha (alta)** → aceito conscientemente: o freio mínimo libera
   o tempo; 019 e lançamento voltam a ser prioridade.
3. **Instrumentação de pricing seria fé (média)** → repensado: contagem por ação e métricas de
   uso entram **junto com #39**, quando existir plano pago pra calibrar. WTP de fã de beta não
   prevê WTP de mercado.

Premissa de fé que ainda vigia tudo: **o lançamento será controlado, não aberto em escala.** Se
isso mudar, reabrir #31 (o teto por-usuário não protege de muita gente legítima ao mesmo tempo).

## Como saber se acertamos

- **Curto prazo:** custo de IA do mês fica em dezenas de dólares e nenhum usuário legítimo
  reclama de limite. Nenhum incidente de sangria (bug/script) passa do kill-switch.
- **Gatilho pra reabrir #39 (construir cobrança):** sinal de **retorno episódico** — pessoas
  voltando em momentos de carreira (a métrica de retenção do produto). Aí sim instrumentar uso e
  calibrar o plano pago.
- **Gatilho pra reabrir #31 (escopo maior):** lançamento deixar de ser controlado / volume subir.

## Próximo passo

`/speckit-specify "Freio de custo de IA: limite por hora nas ações de geração (espelho, post,
autoavaliação, chat) por usuário, trava global de gasto diário com alerta para a operação, e
mensagem honesta ao atingir o limite. Captura/registros nunca são limitados. Sem cobrança, sem
cota mensal. Ponto único de controle em getProvider().complete()."`

Antes de codar: `/impeccable shape` da mensagem de limite (tom da marca). Monetização (#39) não
vira spec agora — fica registrada aqui como hipótese.
