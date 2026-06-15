# Quickstart: Validar a Presença — hub e costura (014)

Validação end-to-end do elo 014. **Pré-requisito**: a 013 já implementada (motor + `drafts` +
componentes de geração). Usa a conta QA.

## Pré-requisitos
- Branch da 014 rodando local; 013 mergeada/presente.
- Conta QA com alguns rascunhos já gerados (013) e ao menos um projeto com 2+ entradas no `/historico`.

## Roteiro

### 1. Hub `/presenca` (US1)
1. Clicar em **Presença** na nav → abrir `/presenca`.
2. Ver a lista de rascunhos persistidos, ordenada por mais recente, com formato, status, data e
   "Baseado em: {origem}".
3. **Retomar** um rascunho → reabre no fluxo de edição da 013 com `body`/ângulo preservados.
4. **Copiar** e **Descartar** → confirmar que o status atualiza (copiado / sai da lista).
5. Com uma conta nova (sem rascunho) → confirmar que o hub mostra os **caminhos de entrada** com
   evidência, nunca uma página em branco.

### 2. Usar um projeto (US2)
1. Abrir um **projeto** com 2+ entradas no `/historico`.
2. Clicar **"Usar este projeto"** → o `GenerateSheet` abre com "Baseado em: projeto {nome} ({n}
   entradas)".
3. Gerar post e resumo de impacto → confirmar que citam entradas **daquele** projeto (sem vazar de
   outro).

### 3. Nudge proativo (US3)
1. Capturar uma entrada **forte** (com impacto/métrica claros).
2. No painel, confirmar que aparece "✦ Isso daria um bom post" para aquela entrada.
3. Clicar no nudge → abre a geração com a entrada carregada; o insight marca `seen`.
4. Capturar uma entrada **fraca** → confirmar que o nudge **não** dispara.

### 4. Isolamento (RLS)
- Com 2 contas, confirmar que os rascunhos e o nudge de uma não aparecem para a outra.

## Checklist de saída
- [ ] Hub lista só rascunhos do próprio usuário; paginado; nunca vazio sem caminhos.
- [ ] "Usar" cobre tema, entrada e projeto com o mesmo motor da 013.
- [ ] Nudge dispara para forte, não para fraco; parcimonioso; nunca gera sozinho.
- [ ] Item de nav coerente em mobile/desktop; sem conflito com a barra da 012-chat.
- [ ] `/impeccable audit` + `/pr-review` antes do PR; cobertura ≥ 80%.
