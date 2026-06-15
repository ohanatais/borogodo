# Quickstart: Validar a Presença — hub, gestão e sugestões (014)

Validação end-to-end do elo 014. **Pré-requisito**: a 013 já implementada (motor + `drafts` +
componentes de geração). Usa a conta QA.

## Pré-requisitos
- Branch da 014 rodando local; 013 mergeada/presente.
- Conta QA com alguns rascunhos já gerados (013) e ao menos um projeto com 2+ entradas no `/historico`.

## Roteiro

### 1. Hub `/presenca`: ver, começar, retomar (US1)
1. Clicar em **Presença** na nav → abrir `/presenca`.
2. Ver a lista de rascunhos **ativos**, ordenada por mais recente, com formato, status, data e
   "Baseado em: {origem}".
3. **Gerar conteúdo** no topo → escolher um tema/entrada/projeto → a geração da 013 abre com a evidência.
4. **Retomar** um rascunho → reabre no fluxo de edição da 013 com `body`/ângulo preservados (sem regerar).
5. Com uma conta nova (sem rascunho) → confirmar os **caminhos de entrada** com evidência, nunca em branco.

### 2. Gestão total do rascunho (US2)
1. **Editar** um rascunho (via retomar) e salvar → a nova versão persiste (`editado`).
2. **Copiar** → status vira `copiado`.
3. **Arquivar** um rascunho → some da lista ativa; aparece no filtro **Arquivados**; **Restaurar** o traz
   de volta.
4. Confirmar que a lista **Ativos** nunca mostra arquivados (conserto do bug).
5. **Excluir definitivamente** → aparece a confirmação ("isso não tem volta"); **Cancelar** não apaga;
   **Excluir** remove de vez (não volta nem no filtro Arquivados).
6. **Filtrar** por status (Ativos/Copiados/Arquivados) e formato (Post/Resumo) → a lista reflete o filtro.

### 3. Usar um projeto (US3)
1. Abrir um **projeto** com 2+ entradas no `/historico`.
2. Clicar **"Usar este projeto"** → o `GenerateSheet` abre com "Baseado em: projeto {nome} ({n}
   entradas)".
3. Gerar post e resumo de impacto → confirmar que citam entradas **daquele** projeto (sem vazar de
   outro).

### 4. Sugestões de conteúdo: Painel + Presença (US4)
1. Capturar uma entrada **forte** (com impacto/métrica claros).
2. No **Painel**, confirmar que aparece "✦ Isso daria um bom post"; clicar → abre a geração com a entrada;
   o insight marca `seen`.
3. Capturar uma entrada **fraca** → confirmar que o nudge **não** dispara.
4. Em **Presença**, confirmar a faixa **"Sugestões pra você"** (nudges pendentes + temas/entradas fortes
   sem rascunho); cada sugestão abre a geração; sem material, a faixa **some** (sem bloco vazio).

### 5. Isolamento (RLS)
- Com 2 contas, confirmar que os rascunhos, o nudge e as sugestões de uma não aparecem para a outra; que
  arquivar/excluir/editar com o id de outro usuário não tem efeito.

## Checklist de saída
- [ ] Hub lista só rascunhos ativos do próprio usuário; paginado/filtrável; nunca vazio sem caminhos.
- [ ] Editar/arquivar/restaurar/excluir funcionam; arquivados fora da lista ativa; excluir é definitivo e
  confirmado.
- [ ] "Usar" cobre tema, entrada e projeto com o mesmo motor da 013.
- [ ] Nudge dispara para forte, não para fraco; faixa de sugestões aparece com material e some sem.
- [ ] Item de nav coerente em mobile/desktop; sem conflito com a barra da 012-chat.
- [ ] `/impeccable audit` + `/security-review` + `/pr-review` antes do PR; cobertura ≥ 80%.
