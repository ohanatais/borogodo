# Implementation Plan: Freio de custo de IA

**Branch**: `023-freio-de-custo` | **Date**: 2026-06-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/023-freio-de-custo/spec.md`

## Summary

Instalar o freio mínimo de custo de IA num **único chokepoint server-side** por onde toda chamada
paga passa: antes de chamar o provider, checa o **limite por hora por usuário** nas ações de
geração; depois da chamada, **registra o consumo (tokens → custo) por usuário**. Sobre esse
registro repousam (a) a **trava global de gasto diário** (US$10), que segura novas chamadas de
geração ao estourar, e (b) os **e-mails de alerta** a admin@borogodo.ai — um preventivo ao cruzar
um limiar (~70%) e um ao atingir o teto — ambos com o retrato do dia (usuários ativos, ranking de
consumo, quem está travado). Captura (Haiku) nunca é bloqueada. Sem cobrança, sem cota mensal.

**Achado central que molda o plano:** hoje `complete()` devolve só `string` (sem tokens, sem
`userId`, sem ação) e existem **dois caminhos** para o provider — a função `complete()` em
`src/lib/ai/client.ts` e chamadas diretas a `getProvider().complete()` em ~5 módulos. Para o
"ponto único de controle" da decisão 002 ser real, o plano **consolida todos os caminhos num só
guard** e faz o provider **devolver o uso de tokens**.

## Technical Context

**Language/Version**: TypeScript estrito (sem `any`), Next.js 15 (App Router, RSC por padrão)

**Primary Dependencies**: Anthropic SDK (`@anthropic-ai/sdk`, já presente), Supabase (Postgres +
Auth + RLS), Zod (validação de boundary). **Nova dependência:** `resend` (envio dos e-mails de
alerta operacional — ver research.md; relacionado à #34, ainda não construída).

**Storage**: Postgres (Supabase). Uma tabela nova `ai_usage_events` (um registro por chamada paga)
e uma tabela de estado de alerta diário `ai_daily_alert_state` (idempotência dos e-mails).
Migration aditiva `014` (os números 013 já estão usados em dobro; 014 é o próximo livre).

**Testing**: Vitest + Testing Library. TDD (Princípio VI): testes do guard (limite por hora,
exenção da captura, cálculo de custo, trava diária) escritos e falhando antes da implementação.

**Target Platform**: Web (Vercel serverless / Edge-compatível onde aplicável); rotas de API.

**Project Type**: Web application (Next.js single project — `src/`).

**Performance Goals**: O guard adiciona no máximo 1 leitura + 1 escrita Postgres por chamada de IA
(que já dura segundos); overhead desprezível. Contagem por hora e soma diária resolvidas por
índices em `ai_usage_events`.

**Constraints**: Princípio I (Security First) — auth antes de tudo, RLS por `user_id`, nenhum dado
de usuário em log. O e-mail de alerta é operacional (vai só para o controlador, admin@borogodo.ai)
e pode conter identificador de usuário para a operação agir — ver Constitution Check.

**Scale/Scope**: Beta controlado, dezenas de usuários. O teto por-usuário protege contra abuso
individual, não contra muitos usuários legítimos simultâneos (premissa registrada na spec).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Security First** — ✅ Guard roda server-side; toda rota já faz `auth.getUser()` antes.
  `ai_usage_events` com RLS travada (escrita/leitura só server). ⚠️ **Ponto de atenção:** o
  e-mail de alerta pode incluir identificador de usuário (e-mail) para a operação saber *quem*
  consome/trava. Isso **não** é log de dado de usuário nem resposta de API — é alerta interno ao
  **controlador** (Ohana). Decisão: incluir e-mail do usuário só no alerta a admin@borogodo.ai;
  nunca em logs (Princípio I mantém `logger` sem dado de usuário) nem em respostas ao cliente.
- **II. TypeScript Strict & Code Quality** — ✅ Funções <40 linhas (guard quebrado em helpers:
  checar limite, registrar uso, avaliar trava diária, despachar alerta). Sem `any`. Erros de
  domínio tipados (`RateLimitedError`, `DailyCapReachedError`) no padrão de `src/lib/errors.ts`.
- **III. AI-First Architecture** — ✅ Tudo sob `src/lib/ai/`. Reforça o princípio: passa a haver
  **um** ponto por onde toda chamada paga passa (hoje furado por chamadas diretas). Modelos
  inalterados (Haiku extração / Sonnet síntese). Mudança aditiva.
- **IV. Server-First & Performance** — ✅ Lógica 100% server. A mensagem honesta é renderizada
  client-side a partir de um código de erro i18n (sem expor detalhe técnico).
- **V. Accessibility & WCAG AA** — ✅ A única superfície de usuário é a mensagem de limite;
  `/impeccable shape` define copy/estado acessível antes de codar a UI.
- **VI. Test-First (TDD)** — ✅ Plano explicita testes-primeiro do guard.
- **VII. Design Identity** — ✅ Mensagem no tom da marca (definida no `/impeccable shape`).

**Resultado do gate: PASS** (com o ponto de atenção de privacidade do e-mail registrado e
resolvido acima). Sem violações que exijam Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/023-freio-de-custo/
├── plan.md              # Este arquivo
├── research.md          # Phase 0 — decisões técnicas (chokepoint, tokens→custo, e-mail, trava)
├── data-model.md        # Phase 1 — ai_usage_events, ai_daily_alert_state, config por env
├── quickstart.md        # Phase 1 — como validar ponta a ponta
├── contracts/
│   └── ai-guard.md      # Phase 1 — contrato interno do guard + erros + payload do alerta
└── tasks.md             # Phase 2 — /speckit-tasks (NÃO criado aqui)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── ai/
│   │   ├── provider.ts            # MOD: complete() devolve { text, usage }; LLMRequest ganha userId + action
│   │   ├── client.ts              # MOD: vira o GUARD (checa limite → provider → registra uso → avalia trava)
│   │   ├── models.ts              # MOD: + mapa de preço por token (Haiku 1/5, Sonnet 3/15) → cost helper
│   │   ├── providers/
│   │   │   ├── anthropic.ts       # MOD: lê message.usage e devolve { text, usage }
│   │   │   └── deepseek.ts        # MOD: idem (usage do SDK ou estimativa)
│   │   └── cost/                  # NOVO: guard isolado e testável
│   │       ├── guard.ts           # orquestra: checkHourlyLimit → run → recordUsage → maybeAlert
│   │       ├── limits.ts          # config por env (limite/hora, teto diário, limiar de aviso)
│   │       ├── cost.ts            # tokens → cost_usd a partir do mapa de preço
│   │       └── alert.ts           # monta e envia os 2 e-mails (resend) com retrato do dia
│   ├── db/
│   │   └── aiUsage.ts             # NOVO: queries (insert evento, count hora, soma dia, ranking, ativos, travados)
│   └── errors.ts                  # MOD: + RateLimitedError, DailyCapReachedError
├── app/api/
│   ├── content/generate/route.ts  # MOD: passa { userId, action:'post'|... } ao guard; mapeia erro → 429
│   ├── autoavaliacao/assist/route.ts        # MOD idem (action:'self_assessment')
│   ├── autoavaliacao/review-cycle/route.ts  # MOD idem
│   ├── chat/route.ts              # MOD idem (action:'chat')
│   └── mirror/generate/route.ts   # MOD idem (action:'mirror')
└── messages/{pt-BR,en}.json       # MOD: + chaves da mensagem honesta de limite

supabase/migrations/
└── 014_ai_usage_events.sql        # NOVO: ai_usage_events + ai_daily_alert_state + RLS + índices

# Call sites que hoje furam o chokepoint (passam a ir pelo guard com userId+action):
#   extractEntries.ts, captureAndReflect.ts (action:'capture' — registra custo, NUNCA bloqueia),
#   generateMirror.ts, evaluateSufficiency.ts, triggerProactiveInsight.ts (action:'insight')
```

**Structure Decision**: Single project Next.js. A lógica de freio vive isolada em
`src/lib/ai/cost/` (alta coesão, testável sem rota), e o `client.ts` existente vira o **único
guard** por onde tudo passa — eliminando os caminhos diretos a `getProvider().complete()`.

## Complexity Tracking

> Sem violações de constituição que exijam justificativa. A consolidação dos caminhos de chamada
> **reduz** complexidade (de 2 caminhos para 1) em vez de aumentá-la.
