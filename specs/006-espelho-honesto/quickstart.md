# Quickstart: Validar o Espelho Honesto

Guia de validação end-to-end da feature (já implementada no PR #13).

## Pré-requisitos

- Dependências instaladas (`npm install`)
- Variáveis de ambiente da Anthropic e Supabase configuradas (para o fluxo de geração real)

## 1. Validar o ruleset determinístico (sem IA, sem rede)

```bash
npx vitest run tests/unit/mirror-ruleset.test.ts
```

**Esperado**: todos os testes passam. Cobre os 9 asserts — fixtures boas retornam zero violações; fixtures ruins retornam as violações esperadas por assert.

## 2. Validar schema e geração

```bash
npx vitest run tests/unit/mirror-schemas.test.ts tests/unit/generate-mirror.test.ts
```

**Esperado**: a saída do espelho é validada por forma (Zod) e por conteúdo (ruleset) antes de persistir.

## 3. Suite completa do espelho

```bash
npx vitest run tests/unit/mirror-ruleset.test.ts \
  tests/unit/mirror-schemas.test.ts \
  tests/unit/generate-mirror.test.ts \
  tests/integration/mirror-generate-route.test.ts \
  src/components/features/espelho/__tests__
```

## 4. Validar a leitura na UI

1. `npm run dev`
2. Logar com um usuário que tenha entradas capturadas.
3. Abrir `/espelho`.

**Esperado**:
- Intro com o nome, 3 cards com evidência citada, fechamento **sem "?"**.
- Nenhum clichê/buzzword/travessão visível.
- Botões "Sim, faz sentido" / "Nem tanto" registram feedback sem regenerar o espelho.

## Critérios de aceite (resumo)

- [ ] `validateMirrorRuleset` retorna `[]` para fixtures boas.
- [ ] Cada uma das 9 classes de violação é detectada.
- [ ] `/espelho` renderiza os blocos com evidência real.
- [ ] Feedback é persistido sem regeneração.
