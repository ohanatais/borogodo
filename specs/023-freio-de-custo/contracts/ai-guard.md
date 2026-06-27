# Contract: AI Guard (chokepoint interno) + erros + alerta

Esta feature não expõe endpoint público novo. O "contrato" é a **interface interna do guard** por
onde toda chamada paga passa, mais os erros que as rotas mapeiam e o payload do e-mail de alerta.

## Interface do guard — `complete()` (em `src/lib/ai/client.ts`)

```ts
type AIAction = 'capture' | 'insight' | 'mirror' | 'post' | 'self_assessment' | 'chat'

interface LLMRequest {
  role: 'extraction' | 'synthesis'
  system: string
  user: string
  maxTokens: number
  userId: string      // NOVO — obrigatório; quem disparou (auth.uid())
  action: AIAction    // NOVO — qual ação, decide se entra no limite/hora e na trava
}

// Inalterado para os callers: continua devolvendo o texto.
function complete(request: LLMRequest): Promise<string>
```

**Comportamento (ordem):**
1. **Pré-checagem (só ações de geração: mirror/post/self_assessment/chat):**
   - Se a contagem de geração do `userId` na última hora ≥ `AI_RATE_LIMIT_PER_HOUR` → lança
     `RateLimitedError`. Não chama o provider.
   - Se o gasto diário agregado ≥ `AI_DAILY_CAP_USD` → lança `DailyCapReachedError`. Não chama o
     provider. (Captura/insight **pulam** esta pré-checagem.)
2. **Chamada:** `getProvider().complete(...)` → `{ text, usage }`.
3. **Registro:** calcula `cost_usd` (tokens × preço) e insere um `ai_usage_events`.
4. **Avaliação de alerta (pós-registro, best-effort):** lê o gasto diário; se cruzou o limiar de
   aviso e ainda não avisou hoje → e-mail preventivo + marca `warned_at`; se cruzou o teto e ainda
   não avisou → e-mail de teto + marca `capped_at`. Falha de e-mail é logada, **não** propaga.
5. **Retorno:** `text`.

**Invariante:** `action='capture'` nunca lança `RateLimitedError` nem `DailyCapReachedError`
(FR-002). É só contabilizada (passos 3–4).

## Erros de domínio (em `src/lib/errors.ts`)

```ts
class RateLimitedError extends Error {
  readonly retryAfterSeconds: number   // segundos até a janela liberar
  readonly action: AIAction
}

class DailyCapReachedError extends Error {
  readonly action: AIAction
}
```

## Mapeamento nas rotas (`/api/...`)

Cada rota de geração captura os dois erros e responde **HTTP 429** com corpo padronizado; o
cliente traduz o `code` para a mensagem honesta i18n (a UI/copy é fechada no `/impeccable shape`).

```jsonc
// 429 — limite por hora
{ "error": "rate_limited", "code": "ai_rate_limited", "retryAfterSeconds": 1800 }

// 429 — trava diária atingida (usuário vê a MESMA mensagem honesta de sobrecarga)
{ "error": "daily_cap", "code": "ai_overloaded" }
```

- `Retry-After` header setado em `retryAfterSeconds` quando aplicável.
- **Nada de detalhe técnico** (valor do teto, gasto, etc.) vaza para o cliente — só o `code` i18n.
- Chaves i18n novas (pt-BR + en), ex.: `errors.aiRateLimited`, `errors.aiOverloaded`.

## Payload do e-mail de alerta (Resend → `OPS_ALERT_EMAIL`)

Dois tipos: `preventive` (limiar) e `cap_reached` (teto). Conteúdo (texto/HTML simples):

```text
Assunto: [Borogodó] {preventivo: gasto de IA em 72% do teto | TETO DIÁRIO ATINGIDO}

Gasto de IA hoje: US$ X,XX de US$ 10,00 (NN%)
Usuários ativos hoje: N

Quem mais consumiu hoje:
  1. fulano@email.com — US$ X,XX (M ações)
  2. ...

Usuários travados agora (limite/hora):
  - beltrano@email.com (atingiu N gerações/h às HH:MM)
  - (nenhum)

[se cap_reached] Novas gerações estão sendo seguradas até virar o dia. Captura segue liberada.
```

**Privacidade (Constitution I):** este e-mail vai **só** para o controlador (admin@borogodo.ai) e
pode conter e-mail de usuário para a operação agir. **Nunca** é logado (o `logger` segue sem dado
de usuário) nem retornado a clientes. Único lugar onde identificador de usuário aparece fora do
banco.

## Contratos de teste (o que o TDD deve cobrir — RED primeiro)

- Geração abaixo do limite → passa; `ai_usage_events` ganha 1 linha com `cost_usd` correto.
- N+1ª geração na hora → `RateLimitedError`, provider **não** chamado.
- Captura com usuário no limite de geração → **passa** (nunca bloqueada), mas é contabilizada.
- Gasto diário ≥ teto → geração lança `DailyCapReachedError`; captura ainda passa.
- Cruzar o limiar de aviso → e-mail preventivo **uma vez** (segunda chamada no mesmo dia não
  reenvia); idem teto via `ai_daily_alert_state`.
- Falha no envio de e-mail → chamada de IA conclui normalmente (best-effort).
- `cost_usd` = tokens × preço para Haiku e Sonnet (valores da tabela de preço).
