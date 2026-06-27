# Research: Freio de custo de IA

Fase 0 — decisões técnicas que resolvem os "NEEDS CLARIFICATION" e fundamentam o design.

## 1. Onde aplicar o freio (o "ponto único de controle")

**Decisão:** consolidar tudo num **único guard server-side** — a função `complete()` em
`src/lib/ai/client.ts` passa a ser esse guard. Toda chamada paga passa por ele com contexto
(`userId`, `action`). Os ~5 módulos que hoje chamam `getProvider().complete()` direto
(`extractEntries`, `captureAndReflect`, `generateMirror`, `evaluateSufficiency`,
`triggerProactiveInsight`) são religados para passar pelo guard.

**Rationale:** a decisão 002 fixou "ponto único em `getProvider().complete()`", mas na prática há
dois caminhos e nenhum carrega `userId`/ação. Sem consolidar, parte das chamadas furaria o freio.
O guard único também é onde o custo é registrado — uma coisa só, fácil de testar.

**Alternativas descartadas:**
- *Enforçar em cada rota (middleware por endpoint):* duplicação em 5+ rotas, fácil esquecer uma
  nova (viola DRY e o próprio princípio do chokepoint).
- *Enforçar dentro do provider (`anthropic.ts`):* o provider não deve conhecer regra de negócio
  (limite/usuário); quebra a separação e teria que se repetir no `deepseek.ts`.

## 2. Como obter o custo de cada chamada (tokens → US$)

**Decisão:** o provider passa a devolver `{ text, usage: { inputTokens, outputTokens } }` em vez de
só `string`. O Anthropic SDK já expõe `message.usage.input_tokens` / `output_tokens`. Um mapa de
preço por token (em `models.ts`) converte tokens em `cost_usd`.

Preços (jun/2026, decision record 002), por milhão de tokens (in / out):
- `claude-haiku-4-5` (extração): US$1 / US$5
- `claude-sonnet-4-6` (síntese): US$3 / US$15

`cost_usd = inputTokens/1e6 * priceIn + outputTokens/1e6 * priceOut`.

**Rationale:** custo real medido (não estimado) é o que torna a trava diária e o ranking
confiáveis. Só 2 implementações de provider mudam; os call sites chamam o guard (`complete()`),
que continua devolvendo `string` para eles — então o refactor não vaza para quem só quer o texto.

**Alternativas descartadas:**
- *Estimar custo por contagem de caracteres:* impreciso; o SDK já dá o número exato de graça.
- *Mudar a assinatura de `complete()` para devolver tokens a todos os callers:* churn
  desnecessário; o uso fica encapsulado no guard.

**Nota DeepSeek:** provider alternativo (raramente usado). Se o SDK não expuser usage de forma
equivalente, registrar custo 0/estimado e seguir — não é o caminho do beta (Anthropic é o default).

## 3. Limite por hora — contagem e identidade

**Decisão:** contagem por **usuário autenticado** (não IP — todas as rotas de geração já exigem
login), em **janela deslizante de 1 hora**, calculada por `count(*)` em `ai_usage_events` onde
`action ∈ {ações de geração}` e `created_at > now() - interval '1 hour'`. Default: **10/hora**
(env). Captura (`action='capture'`) e insight nunca entram nessa contagem.

**Rationale:** janela deslizante via timestamp é exata e não precisa de job de reset; reusa a
mesma tabela de custo (uma fonte de verdade). Sem Redis/Upstash no projeto — Postgres resolve no
volume do beta.

**Alternativas descartadas:**
- *Contador incremental com TTL (Redis/Upstash):* nova infra para um volume que Postgres aguenta
  folgado; YAGNI.
- *Janela de relógio fixa (por hora cheia):* permite rajada na virada da hora; deslizante é mais
  honesta.

## 4. Trava diária — o que ela bloqueia (resolve uma ambiguidade da spec)

**Decisão:** a soma diária de custo considera **todas** as chamadas (captura + geração) para o
alerta ser fiel. Mas quando o teto (US$10) é atingido, a trava **bloqueia apenas ações de
geração** (Sonnet, as caras); **captura continua fluindo** (Princípio do moat: captura nunca é
limitada).

**Rationale:** o runaway realista que sangra US$10 é um loop de geração (US$0,05/ação), não de
captura (US$0,01, exigiria ~1000 chamadas). Bloquear geração mata o dano real sem ferir a regra 1
da decisão 002 ("captura nunca limita"). O alerta ainda soma tudo, então a operação vê a verdade.

**Alternativas descartadas:**
- *Bloquear tudo (incl. captura) ao estourar:* fere o moat; e o cenário de captura sozinha
  estourando o teto é implausível no beta.
- *Não somar captura no total:* o alerta mentiria sobre o gasto real do dia.

## 5. Alertas por e-mail — mecanismo e idempotência

**Decisão:** usar **Resend** (`resend` npm) para enviar a admin@borogodo.ai. Dois e-mails por dia
no máximo: **preventivo** (ao cruzar o limiar, default 70% do teto) e **teto-atingido**.
Idempotência via tabela `ai_daily_alert_state` (uma linha por dia: `warned_at`, `capped_at`) —
cada e-mail sai **uma vez** por dia. Envio é *best-effort*: falha de e-mail é logada (sem dado de
usuário) e **não** quebra a chamada de IA nem a trava.

**Rationale:** Resend é o caminho mais battle-tested para transacional em Next/Vercel, com SDK
simples; resolve a #34 só para o canal operacional (sem depender do fluxo de auth do Supabase). A
tabela de estado evita spam de e-mail a cada chamada após cruzar o limiar.

**Dependência registrada:** precisa de `RESEND_API_KEY` e um remetente verificado no domínio
`borogodo.ai` (DNS/DKIM). `OPS_ALERT_EMAIL=admin@borogodo.ai` em env. Isso **antecipa parte da
#34** — anotar lá. Se o domínio não estiver verificado a tempo, fallback temporário: alerta via
`logger.error` (visível no painel da Vercel) até o e-mail entrar — o freio em si (a trava) não
depende do e-mail funcionar.

**Conteúdo do e-mail (retrato do dia):** gasto acumulado, nº de usuários ativos hoje, top
consumidores (e-mail + custo), usuários travados hoje (atingiram o limite/hora). Ver
`contracts/ai-guard.md`.

**Alternativas descartadas:**
- *Supabase Auth e-mails:* servem a fluxos de auth, não a alerta operacional arbitrário.
- *Nodemailer + SMTP próprio:* mais setup/manutenção de entregabilidade que Resend.
- *Só logar (sem e-mail):* a usuária pediu e-mail explicitamente; log fica como fallback.

## 6. Configuração dos limites

**Decisão:** via **variáveis de ambiente** (no padrão do projeto, ex. `AI_PROVIDER`):
`AI_RATE_LIMIT_PER_HOUR` (10), `AI_DAILY_CAP_USD` (10), `AI_DAILY_WARN_RATIO` (0.7). Lidas em
`src/lib/ai/cost/limits.ts` com defaults e validação (Zod/number guard).

**Rationale:** "configurável pela operação sem mudar comportamento de produto" (FR-011) é
satisfeito por env na Vercel — sem tabela de config nem deploy de código. KISS/YAGNI.

**Alternativa descartada:** tabela `config` no banco — flexível demais para o beta; ninguém vai
ajustar isso de hora em hora.

## 7. Ações de geração cobertas (mapeamento ação → freio)

| `action`           | Modelo (role)     | Limite/hora? | Conta no custo diário? | Bloqueada pela trava? |
|--------------------|-------------------|:------------:|:----------------------:|:---------------------:|
| `capture`          | Haiku (extraction)| não          | sim                    | **não** (moat)        |
| `insight`          | (síntese interna) | não          | sim                    | não                   |
| `mirror` (espelho) | Sonnet (synthesis)| **sim**      | sim                    | **sim**               |
| `post`             | Sonnet            | **sim**      | sim                    | **sim**               |
| `self_assessment`  | Sonnet            | **sim**      | sim                    | **sim**               |
| `chat`             | Sonnet            | **sim**      | sim                    | **sim**               |

`insight` é proativo/disparado pelo sistema, não pelo usuário — fora do limite anti-robô, mas
contabilizado no custo. As 4 ações de geração disparadas pela pessoa são as do limite/hora.

## Resumo das decisões

- Um guard único (`client.ts`) com `{ userId, action }`; religar os 5 call sites diretos.
- Provider devolve `{ text, usage }`; `models.ts` ganha mapa de preço → `cost_usd`.
- Limite/hora por usuário (10), janela deslizante via `ai_usage_events`.
- Trava diária US$10 soma tudo, bloqueia só geração; captura imune.
- Resend para 2 e-mails idempotentes (`ai_daily_alert_state`); fallback log; precisa
  `RESEND_API_KEY` + domínio verificado (toca #34).
- Limites por env. Migration aditiva `014`.
