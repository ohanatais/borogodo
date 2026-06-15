# Plan: Skills & Categorias — Credibilidade, Engajamento, Prova de Valor

## Context

A análise crítica revelou quatro gaps estruturais no sistema atual de categorias/skills:

1. **Credibilidade**: O tier "Comprovada" pode ser atribuído pela IA sem evidência externa real. A promessa central do produto (diferente do LinkedIn endorsement porque tem lastro) fica sem garantia.
2. **Engajamento**: O painel mostra só `strengthThemes` (tags simples). As categorias e a progressão de tier ficam invisíveis no painel — não há gancho que traga o usuário de volta para adicionar mais entradas.
3. **Prova de valor**: A Decisão C do draft (mapeamento categoria → dimensão de recrutador) foi aprovada em jun/2026 mas nunca foi implementada na UI. O usuário não entende por que essas categorias importam para quem o avalia.
4. **Empty state silencioso**: Quando `categories` está vazio, `MacroCategoryTabs` retorna `null` — o usuário não sabe se é bug, loading ou feature em construção.

Objetivo: fechar os quatro gaps criando um **loop de engajamento** claro — painel mostra teaser de skills com tiers → usuário vai ao espelho → vê contexto de recrutador + progressão de tier → volta a adicionar entradas. Sem nenhuma migration de banco (o campo `mirror` JSONB já armazena `categories`).

---

## Grupo 1 — Credibilidade do tier (prompt + validação)

### A. `src/lib/ai/mirror/prompts/firstMirror.ts`

Na seção `CATEGORIAS DE SKILL (006c)`, adicionar três blocos após as definições de tier:

**Comprovada guard** (instrução explícita ao modelo):
> "Tier Comprovada só quando a evidence_text cita resultado externo concreto: número com impacto, nome de empresa + resultado, review documentado ou reconhecimento formal. Sem evidência externa, máximo Consistente."

**Brasilidade nas categorias** (atualmente só está nas regras narrativas 7–10, não na seção de categorias):
> "Skills do contexto brasileiro são de primeira classe, não adjetivos. Podem aparecer em qualquer categoria com evidência: versatilidade forjada na escassez → Execução ou Domínio; navegação de instabilidade → Execução ou Estratégia e Visão; articulação relacional → Influência e Liderança."

**Recruiter context** (informa o modelo do peso relativo de cada categoria):
> "(Contexto: Execução = 'delivery/ships product'; Insight = 'product sense/analytical'; Estratégia = 'strategy/business impact'; Influência = 'leadership/stakeholders'; Domínio = 'market fit/especialização')"

### B. `src/lib/ai/mirror/validateRuleset.ts`

Adicionar **rule 10** (após as 9 existentes):
- Para cada skill com `tier === 'Comprovada'`, checar que `evidence_text` não está vazio e tem ≥ 20 caracteres.
- Retornar como `RulesetViolation` com `assertion: 10` e mensagem: `"Skill Comprovada sem evidência suficiente: '<skill.name>'"`.
- Severity: warning (não bloqueia, mas aparece no relatório).
- Iterar sobre `mirror.categories ?? []` → `.flatMap(c => c.skills)` → filtrar por tier.

Adicionar testes correspondentes em `src/lib/ai/mirror/__tests__/validateRuleset.test.ts` (criar o arquivo se não existir):
- Comprovada com `evidence_text: ''` → viola rule 10
- Comprovada com `evidence_text: 'bom'` (< 20 chars) → viola rule 10
- Comprovada com evidência adequada → sem violation

---

## Grupo 2 — UI do espelho

### C. `src/components/features/espelho/MacroCategoryTabs.tsx`

Duas mudanças (nomes de categorias permanecem como estão — já são claros e universais):

1. **Empty state**: Substituir `if (categories.length === 0) return null` por:
   ```tsx
   if (categories.length === 0) return (
     <div>
       <SectionLabel>{t('categories.title')}</SectionLabel>
       <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
         {t('categories.emptyState')}
       </p>
     </div>
   )
   ```

2. **Defensive empty category**: No `categories.map(...)`, filtrar com `.filter(cat => cat.skills.length > 0)` antes de renderizar tabs e accordions.

### E. `src/components/features/espelho/SkillTierItem.tsx`

Duas mudanças:

1. **Tier progression hint**: Após o `EvidenceText`, para tier Emergente e Consistente, renderizar uma linha `text-xs` com `color: var(--muted-foreground)` e a mensagem de progressão:
   ```tsx
   {skill.tier !== 'Comprovada' && (
     <p className="mt-1 text-xs" style={{ color: 'var(--muted-foreground)' }}>
       {t(`categories.skillProgress.${skill.tier}`)}
     </p>
   )}
   ```

2. **Comprovada visual upgrade**: No badge do tier Comprovada, adicionar ícone `CheckCircle2` (Lucide, size 10) à esquerda do texto, inline. Sem mudança de cor (já usa `--color-primary`). O ícone sinaliza "verificado", não apenas "classificado".
   ```tsx
   {skill.tier === 'Comprovada' && <CheckCircle2 size={10} aria-hidden="true" className="mr-0.5" />}
   {tierLabel}
   ```

### F. `src/messages/pt-BR.json` — adições em `espelho.categories`

```json
"categories": {
  "title": "Seus skills por categoria",
  "emptyState": "Continue capturando para ver seus skills organizados por categoria.",
  "tier": { ... },
  "skillProgress": {
    "Emergente": "Mais situações como essa elevam para Consistente.",
    "Consistente": "Um resultado externo comprovado eleva para Comprovada."
  }
}
```

---

## Grupo 3 — Engajamento no painel (sem migration de banco)

### G. `src/lib/panel/getPanelData.ts`

Adicionar `mirror` ao select da query `mirror_snapshots`:
```typescript
.select('primary_strength, strength_themes, generated_at, entry_count, mirror')
```

Computar `skillSummary` após o fetch (server-side, custo zero):
```typescript
import type { MacroCategory } from '@/types/mirror'

const categories: MacroCategory[] = (snapshotRow?.mirror as { categories?: MacroCategory[] })?.categories ?? []
const allSkills = categories.flatMap(c => c.skills)
const skillSummary = allSkills.length > 0 ? {
  comprovadas: allSkills.filter(s => s.tier === 'Comprovada').length,
  consistentes: allSkills.filter(s => s.tier === 'Consistente').length,
  emergentes: allSkills.filter(s => s.tier === 'Emergente').length,
  total: allSkills.length,
} : null
```

Adicionar `skillSummary` ao objeto `PanelMirror` retornado.

### H. Tipos em `getPanelData.ts`

```typescript
interface SkillSummary {
  comprovadas: number
  consistentes: number
  emergentes: number
  total: number
}

// PanelMirror (já existente, adicionar campo):
interface PanelMirror {
  headline: string | null
  strengthThemes: string[]
  skillSummary: SkillSummary | null  // null se snapshot não tem categorias
}
```

### I. `src/components/features/painel/BorogodoCard.tsx`

Adicionar ao componente: prop `mirror` já existe com `PanelMirror | null`. Renderizar `SkillSummaryStrip` abaixo dos strengthThemes chips, apenas quando `mirror?.skillSummary != null`:

```tsx
{mirror?.skillSummary && (
  <div className="flex flex-wrap gap-2 mt-2">
    {mirror.skillSummary.comprovadas > 0 && (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
        style={{ background: 'var(--color-primary)', color: 'var(--color-primary-fg)' }}>
        {t('skills.comprovadas', { count: mirror.skillSummary.comprovadas })}
      </span>
    )}
    {mirror.skillSummary.consistentes > 0 && (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
        style={{ background: 'var(--color-warm)', color: 'var(--color-warm-text)' }}>
        {t('skills.consistentes', { count: mirror.skillSummary.consistentes })}
      </span>
    )}
    {mirror.skillSummary.emergentes > 0 && (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
        style={{ background: 'var(--color-lilas-nevoa)', color: 'var(--color-lilas-nevoa-text)' }}>
        {t('skills.emergentes', { count: mirror.skillSummary.emergentes })}
      </span>
    )}
  </div>
)}
```

A mesma paleta de cores do `SkillTierItem` reforça o vocabulário visual do sistema de tiers.

### J. `src/messages/pt-BR.json` — nova seção `skills` (ou dentro de `painel`)

```json
"skills": {
  "comprovadas": "{count, plural, one {# comprovada} other {# comprovadas}}",
  "consistentes": "{count, plural, one {# consistente} other {# consistentes}}",
  "emergentes": "{count, plural, one {# emergente} other {# emergentes}}"
}
```

---

## Grupo 4 — Testes

### K. `src/components/features/espelho/__tests__/MacroCategoryTabs.test.tsx`

Adicionar:
- `categories=[]` → renderiza `emptyState` string, não retorna vazio
- `categories` com uma categoria vazia (`skills: []`) → tab não aparece

### L. `src/components/features/espelho/__tests__/SkillTierItem.test.tsx`

Adicionar:
- Tier Emergente → hint de progressão visível
- Tier Consistente → hint de progressão visível
- Tier Comprovada → sem hint de progressão, ícone `CheckCircle2` presente

### M. `src/lib/ai/mirror/__tests__/validateRuleset.test.ts`

Criar arquivo (ou adicionar ao existente):
- Comprovada com `evidence_text: ''` → violation rule 10
- Comprovada com `evidence_text: 'ok'` (curto) → violation rule 10
- Comprovada com `evidence_text: 'ARR cresceu para $400K+ na Gestão DS'` → sem violation

---

## Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/lib/ai/mirror/prompts/firstMirror.ts` | Comprovada guard + brasilidade + recruiter context na seção 006c |
| `src/lib/ai/mirror/validateRuleset.ts` | Rule 10: Comprovada evidence check |
| `src/components/features/espelho/MacroCategoryTabs.tsx` | Empty state + filter empty categories |
| `src/components/features/espelho/SkillTierItem.tsx` | Tier progression hint + CheckCircle2 no badge Comprovada |
| `src/lib/panel/getPanelData.ts` | Select `mirror`, compute `skillSummary` |
| `src/components/features/painel/BorogodoCard.tsx` | SkillSummaryStrip com contagens por tier |
| `src/messages/pt-BR.json` | Strings: emptyState, recruiterLabel, skillProgress, skills (plural) |
| `src/lib/ai/mirror/__tests__/validateRuleset.test.ts` | **NOVO** — testes rule 10 |
| `src/components/features/espelho/__tests__/MacroCategoryTabs.test.tsx` | Testes: empty state, recruiter label, empty category |
| `src/components/features/espelho/__tests__/SkillTierItem.test.tsx` | Testes: tier hints + Comprovada icon |

---

## Fora de escopo (scale problems, não MVP)

- **Skill identity persistente**: `skill.id` rastreável across regenerações
- **`aliases[]`**: normalização de sinônimos entre usuários (skill graph)
- **Denormalização de `skill_summary` no banco**: otimização de query quando volume justificar
- **Tracking de progressão de tier ao longo do tempo**: comparar espelhos históricos

---

## Verificação

1. **Testes**: `npx vitest run` — todos os testes do espelho e validateRuleset passando, incluindo os novos.
2. **Validação de prompt** (manual com fixture existente):
   - Skills com tier "Comprovada" têm evidence_text com referência externa explícita.
   - Skills brasileiras aparecem nas categorias quando relevante.
   - validateRuleset não produz violações na fixture exemplos-ouro #1 e #4.
3. **Browser — loop de engajamento** (caminho principal):
   - Painel: BorogodoCard exibe strip de skills com tiers quando snapshot tem categories.
   - Espelho → tab ativo: recruiter dimension label visível abaixo do título da seção.
   - Skill Emergente: hint de progressão visível abaixo da evidência.
   - Skill Comprovada: ícone ✓ no badge, sem hint de progressão.
   - Categories vazio: empty state explicativo em vez de espaço em branco.
4. **Backward compat**: snapshot antigo (sem `categories`) não quebra painel nem espelho — `skillSummary` fica `null`, strip não renderiza, empty state aparece no espelho.
