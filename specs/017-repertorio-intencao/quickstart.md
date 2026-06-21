# Quickstart / Verificação manual: Repertório (017)

Pré: conta de teste com histórico (use `/reset-user` + registre algumas entradas se precisar) e um
Espelho gerado (temas de força presentes).

## Automatizado
1. `npm test` — suites novas (intenções, zod do contexto de chat, envio de `angle` no
   GenerateSheet, `qa.moment` no DraftCard, eventos da bifurcação, prompt de preparação, starters
   por momento) + regressão (presença, chat, content). Cobertura ≥80%.
2. `npm run build` && `npx tsc --noEmit` — TS estrito, sem `any`.

## Manual (end-to-end)
1. **Painel (com entradas)**: abaixo do cartão de destaque aparece o convite com dois gatilhos
   (frase + exemplos). Clicar leva ao Repertório (na seção certa, se âncora). Conta sem entradas:
   convite ausente.
2. **Nav/cabeçalho** leem "Repertório" e apontam para `/presenca`; bookmark antigo de `/presenca`
   ainda abre.
3. **Repertório** mostra dois hubs + "Meus rascunhos" com os rascunhos antigos intactos (retomar,
   copiar, arquivar, excluir funcionam).
4. **MOSTRAR**: card Post gera post; card Bio gera mini-bio (mesmo resultado de antes).
5. **PREPARAR → Entrevista → "Quero algo pronto agora"**: gera um resumo de impacto com ângulo de
   entrevista (o ângulo aparece no card). **"Quero treinar conversando"**: abre o chat enquadrado
   no momento, com sugestões próprias. Repetir para **Review** e **Salário**.
6. Salvar um rascunho de preparação e confirmar no banco de teste que `qa.moment` foi gravado.
7. **Espelho**: "Criar minha bio" abre a geração de bio a partir da trajetória; sem temas de força,
   o botão não aparece.

## Critérios de aceite (mapeados à spec)
- SC-001: do Painel a um conteúdo pronto em ≤3 cliques.
- SC-002: ambos os caminhos coerentes nos 3 momentos.
- SC-003: rota intacta (nenhum link quebra).
- SC-004: zero regressão em "Meus rascunhos".
- SC-005: nenhuma migração.
- SC-006: ≤4 cards/hub, 2 hubs.
