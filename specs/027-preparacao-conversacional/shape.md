# Design Brief: Preparação Conversacional

## Feature Summary

Uma cabine de preparação para profissionais em situação de ansiedade e alta importância. O usuário
escolhe o momento, fornece contexto em linguagem natural e recebe orientação ancorada em evidências
reais, sem atravessar um gerador intermediário.

## Primary User Action

Responder à pergunta contextual do momento. Todo o restante deriva dessa resposta.

## Design Direction

- **Estratégia**: Restrained; creme de fundo, branco para leitura, roxo somente em ação/estado.
- **Cena**: profissional no notebook na véspera de uma conversa importante, focado e possivelmente
  ansioso; interface clara, luminosa e sem teatralidade.
- **Referências**: ChatGPT para continuidade conversacional; Linear para densidade e hierarquia;
  Notion para blocos de fonte legíveis.
- Headings operacionais em Geist Sans, conforme decisão explícita da fundadora.

## Scope

Produção completa: tela de seleção, chat ampliado, evidências ricas, salvar preparação, lista de
salvos, estados mobile/desktop e compartilhamento opt-in.

## Layout Strategy

1. Tela Me preparar: título direto + três opções brancas em uma linha no desktop e coluna no mobile.
2. Clique abre chat imediatamente; a tela-base permanece como contexto no desktop.
3. Chat de preparação: full-screen mobile; painel lateral largo desktop.
4. Pergunta inicial ocupa o estado vazio, com exemplo de conteúdo esperado.
5. Resposta e “Evidências usadas” formam um único grupo visual.
6. Salvar é ação secundária abaixo da resposta, não CTA global.
7. Preparações salvas aparecem abaixo dos momentos, em lista simples.

## Key States

- Seleção de momento; intake sem token; enviando; streaming; resposta com/sem evidências; prova
  expandida; salvando/salvo/erro; limite de IA; sem registros; lista vazia/com itens; confirmação de
  compartilhamento; mobile com teclado aberto.

## Interaction Model

- Cards de momento abrem o mesmo ChatSheet com `context.preparacao`.
- Intake envia a primeira mensagem somente após ação do usuário.
- Evidência abre registro ou prova; imagem amplia em dialog acessível.
- “Salvar preparação” persiste apenas aquela resposta.
- “Compartilhar para melhorar” abre confirmação descrevendo o conteúdo enviado.

## Content Requirements

- Perguntas específicas por momento; instrução para colar job description em vez de prometer leitura
  de link; rótulo “Evidências usadas”; distinção “Prova anexada”; mensagens claras de ausência,
  salvamento e consentimento.

## Implementation References

`layout.md`, `adapt.md`, `harden.md`, `clarify.md` e `product.md` do Impeccable.

## Confirmed Direction

Confirmado na conversa em 19/07/2026: remover “Quero algo pronto”, abrir chat por momento, ampliar o
chat, evidenciar links/imagens, salvar preparação sem histórico e mover Autoavaliação para Usar.
