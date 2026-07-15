# Quickstart: Organizar + Destaques

Guia de validação manual, um roteiro por user story — não é o passo a passo de implementação
(isso é `tasks.md`), é como confirmar que cada história funciona fim a fim depois de implementada.

## Pré-requisitos

- Migration `016_entry_highlights.sql` aplicada localmente (`supabase db reset` ou `supabase
  migration up`, ambiente de dev).
- Usuário de teste autenticado (ver `borogodo-qa-test-user` na memória do projeto, ou qualquer
  conta local).
- Ao menos 1 registro salvo via drawer (`/painel`, gatilho de registrar) antes de cada roteiro,
  quando o roteiro pedir "um registro salvo".

## US1 — Organizar sob demanda

1. No drawer, salve um texto cru com um anexo de imagem e nenhum campo estruturado preenchido.
2. Em Registros, abra o registro e clique em "Organizar".
3. **Esperado**: em <15s, métrica/impacto/tags aparecem preenchidos e editáveis (SC-001).
4. Repita, mas preencha manualmente "impacto" antes de clicar em "Organizar".
5. **Esperado**: "impacto" permanece com o valor manual após a organização rodar (SC-003).
6. Salve um texto cru sem nenhum anexo e clique em "Organizar".
7. **Esperado**: o sistema ainda infere métrica/impacto/tags a partir só do texto (não exige
   anexo).
8. Salve um texto mencionando um período explícito ("em março") e clique em "Organizar".
9. **Esperado**: período preenchido com o valor identificado — repita com um texto sem sinal de
   período: o campo permanece vazio (nunca "adivinhado").

## US2 — Contexto por pílulas

1. Abra um registro qualquer — confirme que a área de contexto mostra pílulas com empresas já
   usadas + "Projeto pessoal" + "Outro".
2. Selecione uma empresa já existente — confirme preenchimento imediato, sem chamada de rede de
   IA (SC-007, 1 clique, sem digitação).
3. Selecione "Projeto pessoal" — confirme que o registro NÃO aparece com sinalização de "contexto
   não identificado" (FR-008 acceptance #3).
4. Selecione "Outro", digite um nome novo, salve — confirme que esse nome aparece como pílula
   própria em um registro futuro (vocabulário cresce, FR-005).
5. Salve um registro sem tocar nas pílulas e sem organizar — confirme sinalização discreta de
   "contexto não identificado" no card do feed (SC-008).
6. Organize um registro cujo texto mencione claramente uma empresa central e outra lateral (ex.:
   retrospectiva de migração de fornecedor) — confirme que a pílula pré-selecionada é a da empresa
   central, e que ela é editável (FR-007).

## US3 — Organização silenciosa

1. Salve um registro sem clicar em "Organizar", navegue para outra tela.
2. Volte a Registros pouco depois — confirme que os campos já aparecem preenchidos, sem ação
   adicional (FR-009, SC-002: 100% dos registros terminam com ao menos 1 destaque).
3. Durante os poucos segundos de processamento (se conseguir capturar a janela), confirme o
   estado transitório "organizando…" sem CTA adicional (FR-011).
4. Force um erro na chamada de IA (ex.: desligar a chave de API em dev) e salve um registro —
   confirme que o registro permanece salvo e visível normalmente, sem estado de erro bloqueante
   (FR-030), e que "Organizar" manual continua disponível para tentar de novo.

## US4 — Múltiplos destaques por fonte

1. Salve um texto cru descrevendo 2 resultados distintos de uma mesma reunião — organize.
2. **Esperado**: 2 cartões de destaque dentro do MESMO registro, sem registros adicionais criados
   (SC-004).
3. Com 1 destaque só: confirme que o cartão aparece aberto (FR-017).
4. Com múltiplos destaques: confirme que aparecem colapsados por padrão.
5. Clique em "+ adicionar destaque" — confirme um cartão em branco criado, editável.
6. Edite ou remova um destaque — confirme que só aquele destaque muda; o registro e os demais
   destaques permanecem intactos.
7. Organize um texto sem nenhuma métrica clara — confirme que ao menos 1 destaque é criado mesmo
   assim (sem métrica, tratado como válido, FR-018).

## US5 — Título outcome-first

1. Organize um registro com uma redução de tempo mensurável — confirme que o título do destaque
   correspondente inclui o número (ex.: "Redução de 50% no tempo de investigação de bug crítico").
2. Edite esse título e salve — confirme que reorganizações futuras não o sobrescrevem (FR-020).
3. Organize um texto vago sobre "otimização de processos" sem objeto específico — confirme que o
   título busca o objeto concreto mais próximo, evitando a nominalização vaga.

## US6 — Consistência de tags

1. Organize dois registros que descrevem, em palavras diferentes, a mesma habilidade concreta
   ("liderei o time" / "fui responsável pela equipe") — confirme que ambos usam exatamente a
   mesma tag (mesma grafia).
2. Use o filtro por tag em Registros — confirme que ambos os registros aparecem sob a mesma tag.
3. Confirme que nenhuma tag gerada é um adjetivo genérico isolado ("importante", "difícil").
4. Edite/remova uma tag manualmente — confirme que uma reorganização futura não a recria.

## US7 — Registros mostra a fonte

1. Abra Registros com uma fonte de 3 destaques e outra de 1 — confirme 1 card por fonte, selo
   "+3 destaques" na primeira, sem selo na segunda.
2. Expanda a fonte de 3 destaques — confirme que todos os 3 aparecem, com acesso ao texto cru
   completo e aos anexos.
3. Confirme que a miniatura de uma fonte com evidência de imagem é a imagem real, não um ícone
   genérico.
4. Navegue pela timeline — confirme agrupamento por mês.
5. Confirme que a grade-faísca reflete densidade de registros sem streak/emoji.
6. Abra um card com contexto "não identificado" — confirme sinalização discreta, não um badge de
   erro/alerta chamativo.

## Regressão / não-funcionais

- SC-005: comparar tempo de carregamento do feed reestruturado com a build da 025 (antes desta
  feature) — sem regressão perceptível.
- Um registro criado ANTES desta feature (sem `entry_highlights`) continua navegável, tratado
  como fonte de destaque único, com contexto "não identificado" até ação manual (FR-032).
