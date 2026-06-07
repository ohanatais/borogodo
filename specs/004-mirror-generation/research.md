# Research: Geração do Espelho

**Feature**: `004-mirror-generation` | **Date**: 2026-06-07

## Decisões técnicas

### D1 — Modelo de duas velocidades
**Decisão**: Haiku (003) faz o reflexo instantâneo a cada captura; Sonnet (esta feature) faz a
síntese profunda **por limiar** (a cada 3 entradas ou ao abrir `/espelho`/fim do onboarding).
**Racional**: síntese profunda não deve oscilar a cada frase; custo e latência do Sonnet só se
justificam periodicamente. Doc 005 valida (~$0,05/usuário ativo/mês).

### D2 — `REGEN_EVERY = 3`
**Decisão**: regenera quando `newTotal - lastCount ≥ 3`.
**Racional**: equilíbrio entre "ver evoluir" e custo. Constante única, fácil de tunar.
**Alternativas rejeitadas**: regenerar a cada captura (caro, ruidoso); só sob demanda (perde o "vivo").

### D3 — Validação Zod antes de persistir
**Decisão**: `validateMirror` valida a estrutura completa antes do insert.
**Racional**: Princípio III; o jsonb persistido precisa ser confiável para a UI.

### D4 — Client `service_role` para regeneração em background
**Decisão**: `maybeRegenerateMirror` roda após a resposta da captura, sem cookie de sessão; usa um
client `service_role` dedicado que **filtra `user_id` explicitamente** em toda query.
**Racional**: jobs fora do request não têm RLS de sessão; o filtro explícito + client isolado
preserva o isolamento por usuário (Princípio I).
**Alternativas rejeitadas**: rodar regen dentro do request com o client da sessão — bloquearia a
resposta da captura (viola "não bloqueia"); manter no request com `await` adiaria a captura.

### D5 — Substituir o stub de 003, não duplicar
**Decisão**: o corpo real de `maybeRegenerateMirror` vive em `src/lib/ai/mirror/maybeRegenerate.ts`;
o stub de 003 (`src/lib/ai/extraction/jobs.ts`) passa a **reexportar/chamar** o real. A chamada em
`/api/capture` não muda.
**Racional**: evita buraco de integração; a assinatura permanece estável entre features.

### D6 — Feedback "nem tanto" não regera no v1
**Decisão**: grava `resonated=false` + `feedback_text`; não dispara nova geração.
**Racional**: escopo do MVP (doc 005); regenerar com feedback é trabalho futuro.

### D7 — Tolerância a falha em background
**Decisão**: erro na regeneração é logado (sem dados do usuário) e o snapshot anterior é mantido;
nova tentativa ocorre na próxima captura que cruzar o limiar.
**Racional**: a captura nunca pode quebrar por causa do espelho. Constituição: catch loga, não vazio.

## Riscos / atenção

- **`onboarding_completed` em `profiles`**: confirmar se a coluna existe (002). Se não, migration mínima.
- **Concorrência de regeneração**: sem lock no MVP; último snapshot vence. Aceitável.
- **Tamanho do contexto**: limitar a 20 entradas recentes para o prompt do Sonnet.
- **Dependência de 003**: rebase em `main` após o merge de 003 antes de implementar.
