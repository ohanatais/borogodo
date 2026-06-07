# Quickstart: Painel Principal

**Feature**: `005-panel-dashboard`

## Pré-requisitos (ações manuais)

1. **Features 003 e 004 mergeadas** em `main`. Neste branch: `git rebase main`.
2. **Migration Supabase**: rodar `supabase/migrations/00X_proactive_insights.sql` (ver `data-model.md`).
3. **Env**: já cobertas por 003/004 (`ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
4. **i18n**: confirmar `src/messages/pt-BR.json` e o stub `en.json` (estrutura espelhada).

## Antes de codar a UI

- **`/impeccable shape`** já está em `specs/005-panel-dashboard/shape.md`. Revisar.

## Validação rápida (após implementação)

### US2 — leitura ao chegar
- Abrir `/painel` com dados: headline do mirror mais recente (ou fallback "se formando").
- Pill de status: 1–3 → "Em construção"; 4–9 → "Tomando forma"; 10+ → "Ativo".
- Indicador de tempo: "Capturou hoje ✓" / "Há N dias" / "Há 1 semana".

### US1 — captura pelo composer
- Digitar e enviar → sheet "Lendo..." → reflexo → resolver → indicadores sobem (router.refresh).
- Movimento "pergunta" → responder → `/enrich`; "salvar assim" → só resolve.
- Botões de áudio/imagem **desabilitados** com tooltip "em breve".

### US3 — insight e recentes
- Com `proactive_insights.seen=false` → card aparece; sem → card omitido.
- Entradas recentes: máx 3, ícone por `source`, expansão in-place.

## Antes do PR

- **`/impeccable audit`** (Princípios V, VII, VIII, IX).
- Revisar em **375px** (mobile-first); toques ≥ 48px; foco visível; contraste AA.

## Testes
```bash
npm run test -- --coverage   # ≥ 80% (getMirrorStatus, getCapturePrompt, render condicional do insight, fluxo de captura)
```

## Definition of Done
- [ ] `proactive_insights` migrada; `triggerProactiveInsight` implementado (stub de 003 preenchido).
- [ ] Painel RSC com 4 leituras paralelas; headline + indicadores + insight condicional + recentes.
- [ ] Superfície `capture/*` desacoplada e reusável (texto+arquivo ativos; áudio/imagem desabilitados).
- [ ] Zero string hardcoded (i18n); mobile-first 375px; toques 48px; tokens de cor.
- [ ] `/impeccable audit` passou; cobertura ≥ 80%.
