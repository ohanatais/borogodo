# Quickstart: Validar Preparação Conversacional

## Pré-requisitos

- Usuário autenticado com ao menos três registros; um com métrica, um com link e um com imagem.
- Servidor local em `localhost:3000`.

## Cenários

1. Abra Me preparar e confirme somente Entrevista, Avaliação e Aumento.
2. Confirme Autoavaliação no menu Usar desktop e mobile.
3. Clique Entrevista: chat abre sem request de IA, full-screen a 375 px e ~760 px no desktop.
4. Cole uma job description: resposta streama e mostra apenas evidências declaradas.
5. Abra link, imagem e registro a partir dos cards.
6. Salve uma resposta; feche o chat; confirme que mensagens somem e preparação aparece na lista.
7. Exclua a preparação.
8. Inspecione `preparation_events`: nenhum texto livre.
9. Feche conversa sem compartilhar: nenhuma linha em `shared_chat_feedback`.
10. Compartilhe com confirmação: uma linha consentida é criada.

## Verificação automatizada

```bash
npm test -- --run
npm run lint
```

Validar também 375 px, teclado, foco, dark mode e limite de IA.
