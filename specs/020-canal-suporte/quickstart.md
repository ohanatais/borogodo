# Quickstart — Validação manual do canal de contato/suporte

Pré-requisito: app rodando localmente (`npm run dev`) na branch `020-canal-suporte`.

## 1. Rodapé da landing page (FR-004, US1)
1. Abrir a landing page pública (`/` ou `/pt-BR`).
2. Rolar até o fim → ver o **rodapé** com a seção de contato.
3. Confirmar: e-mail `admin@borogodo.ai` aparece como **texto legível**.

## 2. Copiar e-mail (FR-002, FR-003, US1)
1. Clicar em **"copiar e-mail"**.
2. Confirmar: feedback visível ("copiado!") aparece.
3. Colar (Cmd+V) num editor → deve sair `admin@borogodo.ai`.
4. Confirmar: **nenhum app de e-mail nativo abriu** ao interagir com a seção.

## 3. LinkedIn secundário (FR-005, US2)
1. Ver o link de LinkedIn rotulado como canal de conversa/feedback (secundário).
2. Clicar → abre `https://www.linkedin.com/in/ohana-taís/` em **nova aba**.

## 4. SLA honesto (FR-007, US3)
1. Confirmar a microcopy de expectativa de resposta (ex.: "Sou eu que respondo, em até 2 dias úteis").

## 5. Central de Configurações (FR-004)
1. Logar e ir em `/configuracoes`.
2. Confirmar: o **card de contato** aparece na grade, com e-mail copiável + LinkedIn + SLA.

## 6. i18n (FR-008, US3)
1. Trocar para `en` (`/en` ou seletor de idioma).
2. Confirmar: todos os textos (rótulos, botão, SLA, link) aparecem em inglês, sem chave faltando.

## 7. Acessibilidade (FR-009, edge cases)
1. Navegar só com **teclado** (Tab) → o botão de copiar recebe foco visível e é acionável (Enter/Espaço).
2. Com leitor de tela: o feedback de cópia é anunciado (`aria-live`).
3. (Opcional) Simular clipboard bloqueado → o e-mail continua selecionável como texto e a tela não trava.
