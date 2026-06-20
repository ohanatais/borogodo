# Research: Seeds Expandidos de Post (018)

> Todas as ambiguidades foram resolvidas no kickoff e na sessão de clarify (2026-06-15). Zero NEEDS CLARIFICATION ao entrar no planejamento.

## Decisões técnicas consolidadas

| # | Decisão | Escolhida | Alternativa rejeitada |
|---|---------|-----------|----------------------|
| 1 | Modelagem do ângulo | `angle_kind` no `qa jsonb` (sem migration) | `seed_type` novo; coluna nova |
| 2 | Guardrail anti-opinião-vazia | Dupla camada: route pre-check + post-gen check | Só prompt; só pré-check |
| 3 | Injeção do `lastroText` | Prepend como `{ label: 'Lastro' }` na rota antes do `generateDraft` | Campo separado no prompt |
| 4 | UX de seleção de ângulo | Estado `'angle-select'` no `GenerateSheet` antes de `'generating'` | Seleção antes de abrir; geração imediata com ângulo padrão |
| 5 | Capture offer (sinergia 016) | Componente `CaptureOffer` → `POST /api/capture` (sem alteração na rota) | Novo endpoint |
| 6 | Assert 11 (opinião-vazia) | Array `EMPTY_OPINION_TERMS` em `bannedTerms.ts`; assert 11 em `validateRuleset.ts` | Só prompt; não impedir |

## Audit do código existente

| Artefato | Localização | Status para 018 |
|----------|-------------|-----------------|
| `generateDraft` | `src/lib/ai/content/generateDraft.ts` | Reusa; estende `GenerateDraftInput` |
| `loadSeedEvidence` | `src/lib/ai/content/loadSeed.ts` | Reusa sem alteração |
| `validateContentRuleset` | `src/lib/ai/content/validateRuleset.ts` | Estende com assert 11 |
| `bannedTerms.ts` | `src/lib/ai/content/bannedTerms.ts` | Estende com `EMPTY_OPINION_TERMS` |
| `POST /api/content/generate` | `src/app/api/content/generate/route.ts` | Estende Zod schema; add opinion pre-check |
| `POST /api/content/drafts` | `src/app/api/content/drafts/route.ts` | Sem alteração — `qa` já aceita campos arbitrários |
| `GenerateSheet` | `src/components/features/content/GenerateSheet.tsx` | Estende com estado `'angle-select'` |
| `POST /api/capture` | `src/app/api/capture/route.ts` | Reusa sem alteração para o `CaptureOffer` |
| Golden set | `src/lib/ai/content/__tests__/fixtures/goldenSet.ts` | Estende com 2 goodCases + badCase |
| `drafts.qa` | migration 009 | Sem migration — aceita campos JSONB livres |
