# Data Model: Seeds Expandidos de Post (018)

## Sem migration

A 018 não toca o schema do banco. O ângulo, a tese e o flag de captura vivem no `drafts.qa jsonb` existente (migration 009), que já aceita chaves arbitrárias.

## drafts.qa — extensão de payload

```json
{
  "angle_kind": "study | opinion",
  "thesis": "<string max 500, só quando angle_kind = opinion>",
  "lastro_captured": "<boolean, true quando a vivência foi salva como entrada via CaptureOffer>"
}
```

Campos adicionados **somente quando pertinentes** (relato clássico não persiste `angle_kind`).

## Tipos TypeScript novos/estendidos

### `AngleKind` (novo, `src/types/content.ts`)

```typescript
export type AngleKind = 'study' | 'opinion'
```

### `ContentPromptInput` (estendido, `src/lib/ai/content/prompts/discipline.ts`)

```typescript
export interface ContentPromptInput {
  seedSummary: string
  evidence: EvidenceItem[]          // inclui Lastro injetado pela rota quando lastroText presente
  voiceProfile: VoiceProfile | null
  angle?: string | null
  adjust?: AdjustKind | null
  // NEW 018:
  angleKind?: AngleKind | null      // 'study' | 'opinion'; ausente = relato (comportamento original)
  thesis?: string | null            // apenas opinion; tese de 1 linha do usuário
}
```

## Fluxo de evidência por ângulo

```
Relato (ausente/null):
  loadSeedEvidence(entry|theme|project) → [E1..En] → generateDraft

Estudo:
  loadSeedEvidence(entry|theme|project) → [E1..En]
  angleKind: 'study' injetado → buildAngleBlock() adiciona contexto de aprendizado

Opinião (entrada registrada):
  loadSeedEvidence(entry|theme|project) → [E1..En]
  angleKind: 'opinion', thesis injetados → buildAngleBlock() adiciona tese + instrução de âncora

Opinião (vivência na hora):
  lastroText da requisição → { label: 'Lastro', text } prepended antes de E1..En
  angleKind: 'opinion', thesis → mesmo fluxo de geração
  → post-gen: evidence_refs inclui 'Lastro' → passou o guardrail
  → CaptureOffer aparece na UI (salvamento opcional)

Opinião sem lastro:
  evidence vazia + lastroText null → 400 opinion_needs_lastro (pré-check na rota)
```

## Checklist de guardrails

| Guardrail | Camada | Trigger |
|-----------|--------|---------|
| Sem lastro nenhum | Route pre-check | `opinion` + evidence vazia + sem `lastroText` → 400 |
| LLM não ancou | Post-gen check em `generateDraft` | Todos os variants com `evidence_refs.length === 0` → `GenerationFailedError` |
| Jargão de opinião-vazia | Assert 11 em `validateContentRuleset` | "hot take", "impopular mas", "ninguém fala sobre isso" → violação, regenera |
