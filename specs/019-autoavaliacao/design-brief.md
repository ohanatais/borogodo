# Design Brief — Autoavaliação de Desempenho (019)

Produzido pelo `/impeccable shape` (register: **product**). Confirmado pela Ohana em 2026-06-16.
Probes visuais pulados: o harness não tem geração de imagem nativa.

## 1. Feature Summary

A "sala" onde a pessoa colhe o ano: escolhe um período e recebe 2 autoavaliações estruturadas por
seções (Entregas, Impacto, Evolução, Pontos a desenvolver), ancoradas na evidência real das entradas.
Superfície *product* (tarefa de alto valor, alguma ansiedade — ciclo de avaliação chegando). Reusa o
motor e o fluxo de resultado/edição/cópia da Presença (013/014).

## 2. Primary User Action

Escolher um período e gerar → sair com material fiel, pronto para colar no formulário de avaliação. O
seletor de período é o gesto de entrada.

## 3. Design Direction

- **Color strategy: Restrained** (piso do register *product*; DESIGN.md). Roxo-jambo só em ação
  primária/seleção; coral-faísca reservado (≤10%). **Sem alerta/vermelho** em "pontos a desenvolver".
- **Scene sentence:** "Uma PM brasileira, fim de tarde antes da reunião de ciclo, ansiosa mas no
  controle, abre o Borogodó no laptop para montar a autoavaliação que vai levar ao gestor." →
  superfície clara (creme + branco), calma, legível, sem drama.
- **Anchor references:** o próprio `GenerateSheet`/`DraftCard` da Presença (consistência interna é a
  referência mais forte), Notion (blocos de seção legíveis), Linear (densidade calma de *product*).

## 4. Scope

Production-ready · um fluxo (página dedicada → sheet de resultado) + integração do gatilho no painel ·
interativo/shipped · polir até o PR. US1 é o MVP; US2/US3 em fases seguintes do tasks.md.

## 5. Layout Strategy

- **Rota dedicada `/autoavaliacao` (RSC):** headline com a assinatura Fraunces bold+itálico, e o
  **seletor de período em destaque** — presets como chips (este ano · último ciclo) + range
  personalizado revelado ao escolher "outro período". Mobile-first; chips ≥48px.
- **Gerar** dispara o `GenerateSheet` existente (evento `openPresenca`, `seedType: 'period'`,
  `seedRef` do intervalo). Header mostra o período como a "evidência base" ("Baseado em: 2025").
- **Resultado:** cada variação é um `DraftCard` **estendido para render por seções** — Entregas /
  Impacto / Evolução / Pontos a desenvolver como blocos com cabeçalho próprio e hierarquia clara
  (escala de *product*: peso/tamanho, não display). "Pontos a desenvolver" tem o **mesmo tratamento
  visual** das outras seções, enquadrado como crescimento — sem cor de alerta.

## 6. Key States

- **Default (pré-geração):** seletor de período convidativo; preset "este ano" pré-selecionado.
- **Generating:** shimmer de escrita existente (não spinner).
- **Done:** 2 variações por seções + `AdjustChips` + regerar (reuso).
- **Base limitada (período vazio/curto):** não fabrica; estado honesto que **convida a registrar**
  (link pra captura), espelhando o `create.empty` do `PresencaCreate`.
- **Erro (422 anti-IA):** mensagem honesta + regerar (reuso do `GenerateSheet`).
- **Gatilho no painel (US2):** convite ancorado no calendário, sem cobrança; variante "registre
  antes" quando há poucos dados recentes.

## 7. Interaction Model

Escolher preset/range → "Gerar autoavaliação" → sheet abre já gerando → ler as 2 versões por seções →
editar inline / aplicar chip / copiar (marca `copied`) — reuso do `DraftCard`. Transições 150–250ms;
`prefers-reduced-motion` respeitado.

## 8. Content Requirements

Tudo em `pt-BR.json` + espelho `en.json`: título/subtítulo da página; labels dos presets e do range;
"Gerar autoavaliação"; nomes das 4 seções; copy da base limitada ("ainda há pouco aqui pra colher —
registre o que você fez e volte"); convite do gatilho (calendário + variante feed-first); rótulos do
range (de/até). Dinâmico: nº de entradas do período varia (0 → centenas; limite seguro no seed).

## 9. Recommended References

`interaction-design.md` (seletor de período/range, estados de formulário), `layout.md` (hierarquia das
4 seções no card), `clarify.md` (copy do convite e da base limitada — tom revelador, não cobrança).

## 10. Decisões fechadas (eram open questions)

- Range personalizado: dois `<input type="date">` nativos (acessível, mobile-friendly, sem dependência
  nova), revelados inline ao tocar "outro período".
- Entrada: **página dedicada** `/autoavaliacao` (não diluir o momento episódico no picker da Presença).
- Render: **seções visuais reais** no card (não texto corrido).
- Pontos a desenvolver: **enquadrados como crescimento**, sem cor de alerta, mesma hierarquia visual.

## Impacto no tasks.md

A escolha "seções visuais reais" toca **T016** e **T023**: o `DraftCard` ganha um modo que renderiza o
`body` por seções quando `format === 'self_assessment'` (parser leve de cabeçalhos → blocos). Refletido
no tasks.md.
