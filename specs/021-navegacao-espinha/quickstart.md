# Quickstart — Validação manual por fase

Roteiro de validação que prova cada fase end-to-end. Cada fase é um gate independente (a spec
permite entregar e validar em sequência). Pré-requisito: `npm run dev`, logado com uma conta que
tenha espelho + histórico + alguns rascunhos.

## Fase 1 — Menu 6→4 + landing Usar

1. Abrir o app em desktop e em 375px (mobile). **Esperado**: o menu mostra **Painel, Espelho,
   Registros, Usar** + Configurações — e **não** mostra mais Linha do Tempo, Repertório,
   Autoavaliação como itens de topo.
2. Clicar em **Usar**. **Esperado**: página com dois caminhos (mostrar pra fora / me preparar)
   que levam a `/presenca` e `/autoavaliacao`.
3. Navegar para `/presenca` e `/autoavaliacao`. **Esperado**: o destino **Usar** aparece
   destacado no menu.
4. Acessar `/historico` direto. **Esperado**: chega a um destino válido, sem 404 (nesta fase, a
   tela atual; na Fase 3, a vista de Trajetória).

## Fase 2 — `impact_summary` fora das listas

1. A partir de uma entrada, abrir a geração de conteúdo. **Esperado**: "resumo de impacto" não
   aparece entre os formatos.
2. A partir do insight proativo no Painel, idem. **Esperado**: idem.
3. Gerar um post normalmente. **Esperado**: geração funciona (motor intacto). Um rascunho
   `impact_summary` antigo, se houver, ainda lista/abre.

## Fase 3 — Espelho com Forças + Trajetória

1. Abrir **Espelho**. **Esperado**: vista **Forças** por padrão; um controle claro para alternar
   para **Trajetória**.
2. Abrir **Trajetória** e selecionar um projeto. **Esperado**: o detalhe do projeto abre como
   abria na antiga Linha do Tempo (mesmo comportamento).
3. Recarregar em Forças e observar a rede. **Esperado**: a query da Trajetória **não** é feita
   enquanto a vista não é aberta.
4. Acessar `/historico`. **Esperado**: redireciona para o Espelho na vista de Trajetória.

## Fase 4 — Painel como Home (porta de conversa)

1. Abrir **Painel**. **Esperado**: uma porta de conversa no topo; ao acioná-la, o chat abre no
   modo pergunta.
2. Observar os cards do Painel. **Esperado**: os cards atuais continuam lá (nada removido).
3. Em outra página (ex.: Registros), usar o chat. **Esperado**: a barra global "Registrar |
   Perguntar" continua intacta e onipresente.

## Gate de não-regressão (toda fase)

- `npm test` verde — em especial `historico/__tests__/*` e `painel/__tests__/page.test.tsx`.
- Nenhuma rota antiga dá 404.
- Revisão em 375px (mobile-first) e foco/labels acessíveis nas superfícies novas.
