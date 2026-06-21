# Quickstart: Seeds Expandidos de Post (018)

Guia de validação dos cenários da feature. Não inclui código de implementação — os detalhes ficam em `tasks.md` e no código.

## Pré-requisitos

- Worktree `borogodo-018` com `npm run dev` rodando
- Conta QA com ≥ 2 entradas cadastradas (ver `memory/borogodo-qa-test-user.md`)
- `npm run test` funcionando (Vitest)

---

## US3 — Disciplina anti-opinião-vazia (CI gate, sem UI)

### Assert 11 no ruleset

```bash
cd /Users/ohanatais/Documents/borogodo-018
npm run test src/lib/ai/content/__tests__/validateRuleset.test.ts
```

**Esperado**: 3 novos casos ("hot take", "impopular mas", "ninguém fala sobre isso") ativam assert 11. Asserts 1–10 passam sem regressão.

### Golden set com ângulos

```bash
npm run test src/lib/ai/content/__tests__/goldenSet.test.ts
```

**Esperado**: 
- goodCases de estudo e opinião passam (evidence_refs não-vazio, zero violações do ruleset)
- badCase de opinião-sem-anchor (todos evidence_refs vazios) → detectado
- badCases de assert 11 → detectados

---

## US1 — Ângulo de estudo (manual)

1. Acessar `/presenca` com conta QA
2. Clicar "Gerar conteúdo" → selecionar uma entrada com conteúdo real
3. No `GenerateSheet`: selecionar ângulo **"Estudo"** → clicar "Gerar"

**Verificar**:
- 2 variantes exibidas
- Cada variante conecta o aprendizado à evidência real (menção ao que foi feito, não inventado)
- `evidence_refs` não-vazio em ambas
- Nenhum jargão anti-IA detectável (releitura rápida)

---

## US2a — Opinião com entrada registrada (manual)

1. No `GenerateSheet`: ângulo **"Opinião"**
2. Thesis: `"Documentação técnica é vantagem competitiva, não overhead"`
3. Lastro: selecionar entrada registrada (ex: E1)
4. Clicar "Gerar"

**Verificar**:
- 2 variantes defendendo a tese com ao menos uma âncora na entrada selecionada
- A tese aparece como perspectiva/argumento, não como afirmação de fato sobre a pessoa
- `evidence_refs` não-vazio em ao menos 1 variante
- Sem "hot take", "impopular mas", "ninguém fala sobre isso"

---

## US2b — Opinião com vivência dita na hora (manual)

1. No `GenerateSheet`: ângulo "Opinião" → thesis preenchida
2. Lastro: opção "Escrever agora" → digitar: `"No meu último projeto reduzimos a equipe de 8 para 4 pessoas e entregamos mais em menos tempo"`
3. Clicar "Gerar"

**Verificar**:
- 2 variantes ancoradas na vivência digitada
- `CaptureOffer` aparece após os cards
- Aceitar o convite → redireciona ou exibe confirmação de entrada criada
- Verificar no `/historico` ou painel que a entrada foi salva

---

## US2c — Opinião sem lastro (manual)

1. No `GenerateSheet`: ângulo "Opinião" → thesis → **sem** selecionar entrada, **sem** digitar vivência → "Gerar"

**Verificar**:
- Mensagem de erro honesta (sem gerar post)
- Erro identificável como "falta lastro" (não erro genérico)
- Nenhum post vazio ou inventado exibido

---

## Regressão dos formatos existentes (manual rápido)

1. Ângulo **"Relato"** (default, comportamento pré-018) → gera normalmente
2. Formato **"Resumo de impacto"** e **"Mini-bio"** continuam funcionando sem o seletor de ângulo
3. Todos os goodCases do golden set passam (`npm run test`)
