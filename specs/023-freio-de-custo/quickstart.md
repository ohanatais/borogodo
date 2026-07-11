# Quickstart: validar o Freio de custo de IA

Guia de validação ponta a ponta. Não contém implementação — só como provar que funciona.

## Pré-requisitos

- Migration `014` aplicada em **dev** (`mcp apply_migration` ou CLI Supabase). Confirmar com
  `list_migrations` que `014_ai_usage_events` consta.
- Env em dev: `AI_RATE_LIMIT_PER_HOUR`, `AI_DAILY_CAP_USD`, `AI_DAILY_WARN_RATIO`,
  `OPS_ALERT_EMAIL`, `RESEND_API_KEY`. Para testar o freio sem gastar, use valores baixos
  (ex.: `AI_RATE_LIMIT_PER_HOUR=2`, `AI_DAILY_CAP_USD=0.10`, `AI_DAILY_WARN_RATIO=0.5`).
- Conta de teste logada (a conta QA reutilizável serve).

## Cenário 1 — limite por hora bloqueia geração, com mensagem honesta (US1)

1. Com `AI_RATE_LIMIT_PER_HOUR=2`, gere conteúdo (post/espelho) **3 vezes** seguidas.
2. **Esperado:** as 2 primeiras geram normalmente; a 3ª retorna 429 e a UI mostra a mensagem
   gentil no tom da marca (não erro cru, não tela vazia). Header `Retry-After` presente.
3. Confira no banco: `select count(*) from ai_usage_events where action='post'` reflete só as
   chamadas que **chegaram** ao provider (as bloqueadas não inserem linha).

## Cenário 2 — captura nunca é bloqueada (FR-002)

1. Ainda no limite estourado do Cenário 1, **capture** um registro (texto ou áudio).
2. **Esperado:** a captura acontece normalmente. Em `ai_usage_events` aparece uma linha
   `action='capture'` (contabilizada), mas **nenhum** bloqueio.

## Cenário 3 — janela desliza (FR-004)

1. Após estourar o limite, espere a janela (ou, em dev, insira eventos com `created_at` antigo).
2. **Esperado:** assim que a contagem na última hora cai abaixo do limite, a geração volta a
   funcionar sem intervenção.

## Cenário 4 — trava diária + e-mail preventivo e de teto (US2)

1. Com `AI_DAILY_CAP_USD=0.10` e `AI_DAILY_WARN_RATIO=0.5`, gere conteúdo até o gasto diário
   cruzar US$0,05 (50%) e depois US$0,10.
2. **Esperado ao cruzar 50%:** um e-mail **preventivo** chega em `OPS_ALERT_EMAIL`, e a geração
   **continua** funcionando.
3. **Esperado ao atingir US$0,10:** próxima geração retorna 429 (`ai_overloaded`); um e-mail de
   **teto-atingido** chega; **captura ainda passa** (Cenário 2 continua válido).
4. **Idempotência:** continue gerando — **nenhum** e-mail repetido sai no mesmo dia (confira
   `ai_daily_alert_state`: `warned_at` e `capped_at` preenchidos uma vez).
5. **Conteúdo do e-mail:** confere gasto acumulado, nº de usuários ativos, ranking de consumo e
   lista de travados (ver `contracts/ai-guard.md`).

## Cenário 5 — e-mail falha, freio não quebra (best-effort)

1. Configure `RESEND_API_KEY` inválida; force o cruzamento do limiar.
2. **Esperado:** a geração conclui normalmente; o erro de e-mail é logado (sem dado de usuário) e
   **não** propaga. A trava (bloqueio ao atingir o teto) continua valendo independentemente do
   e-mail.

## Cenário 6 — nada bypassa o guard

1. Exercite cada superfície de geração: espelho, post, autoavaliação, chat — e captura/insight.
2. **Esperado:** **toda** chamada paga gera uma linha em `ai_usage_events` (prova de que os
   antigos caminhos diretos a `getProvider().complete()` foram religados ao guard).

## Verificação final (Definition of Done)

- [ ] Cenários 1–6 passam manualmente em dev.
- [ ] Testes Vitest do guard (contratos em `contracts/ai-guard.md`) verdes, ≥80% no módulo
      `src/lib/ai/cost/`.
- [ ] `tsc` e lint limpos; funções <40 linhas; nenhum dado de usuário em `logger`.
- [ ] Mensagem honesta revisada no `/impeccable shape` antes do PR.
- [ ] Migration `014` aplicada em **dev e prod** (na ordem), confirmada por `list_migrations`.
- [ ] `/security-review` rodado (toca auth, input→LLM, e-mail com identificador de usuário).
