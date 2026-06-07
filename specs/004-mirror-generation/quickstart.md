# Quickstart: Geração do Espelho

**Feature**: `004-mirror-generation`

## Pré-requisitos (ações manuais)

1. **Feature 003 mergeada** em `main`. Neste branch: `git rebase main`.
2. **Env**: `ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-side), além das do 002.
3. **Migration Supabase**: rodar `supabase/migrations/00X_mirror_snapshots.sql` (ver `data-model.md`).
4. **Verificar** se `profiles.onboarding_completed` existe; se não, aplicar o `alter table ... add column if not exists`.

## Validação rápida (após implementação)

### US1 — primeira geração
```bash
# autenticado, com ≥ 1 entrada:
curl -X POST http://localhost:3000/api/mirror/generate
# esperado: 200 { mirror:{intro, primary_strength, invisible_skill, context_pattern, closing_question, strength_themes} }
```
Verifique `mirror_snapshots` (1 linha) e `profiles.onboarding_completed = true`.

```bash
# usuário sem entradas:
curl -X POST .../api/mirror/generate
# esperado: 400 "Sem entradas"
```

### US2 — limiar de regeneração (teste unitário)
- `maybeRegenerateMirror(user, lastCount+3)` → chama `generateAndSaveMirror`.
- `maybeRegenerateMirror(user, lastCount+2)` → no-op.

### Integração com 003
Após implementar, **ligar o stub**: em `src/lib/ai/extraction/jobs.ts`, `maybeRegenerateMirror`
passa a chamar `src/lib/ai/mirror/maybeRegenerate.ts`. A chamada em `/api/capture` não muda.
Capturar 3 entradas seguidas deve gerar um novo snapshot em background.

## Testes
```bash
npm run test -- --coverage   # ≥ 80% em geração/validação/limiar
```

## Definition of Done
- [ ] Migration `mirror_snapshots` aplicada; `onboarding_completed` confirmado.
- [ ] `/api/mirror/generate` gera, valida (Zod) e persiste; marca onboarding.
- [ ] `maybeRegenerateMirror` respeita `REGEN_EVERY=3`; falha de background preserva snapshot e loga.
- [ ] Stub de 003 ligado ao corpo real (chamada de `/api/capture` intacta).
- [ ] Jobs background usam `service_role` filtrando `user_id`.
- [ ] Cobertura ≥ 80%; sem `any`; sem catch vazio.
