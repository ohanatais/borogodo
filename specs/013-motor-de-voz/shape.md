# Design Brief: Motor de Voz + Geração (Presença)

**Skill**: `/impeccable shape` | **Date**: 2026-06-15 | **Register**: product (com momentos brand na
voz dos rascunhos)

**Status**: Planejamento — aguardando implementação (ver `tasks.md`). Componentes definidos aqui são
**reusados por 014/015**.

**Fonte**: `docs/conteudo-plano-de-acao.md`, `spec.md`, `.impeccable/design.json` (tokens oklch,
Fraunces/Geist, roxo-jambo).

---

## 1. Feature Summary

A Presença é o verbo **Usar**: pegar o trabalho real já registrado e devolver, na voz da pessoa, algo
pronto para publicar. O gesto central é **"Usar"** a partir de uma evidência (um tema do espelho ou
uma entrada) e ver, em segundos, **dois rascunhos** que soam como ela escreveria — nunca um prompt
vazio. O sentimento alvo: "o produto leu o que eu fiz e escreveu o que eu não tive coragem/tempo de
escrever, e ficou com a minha cara".

## 2. Primary User Action

**Usar** uma evidência para gerar. Tudo mais — escolher entre 2 rascunhos, editar, ajustar com chips,
copiar — é refino sobre o rascunho que já chegou pronto. A calibração de voz é refino opcional, nunca
um portão.

## 3. Design Direction

### Tom e cena
A pessoa termina um projeto, abre o espelho, vê o tema "produto 0→1" e pensa "eu devia postar sobre
isso, mas nunca sei como começar". Clica em **"Usar"**. Em vez da página em branco que a paralisa, dois
rascunhos aparecem citando o que ela mesma fez. Ela reconhece a própria voz, encurta um, copia, posta.
Caloroso, brasileiro, sem o brilho artificial de gerador de template.

### Estratégia cromática (tokens, sem hex cru)
- **Ponto de entrada ("Usar")**: discreto no card de tema/entrada; roxo-jambo (`--color-primary`) como
  acento, não preenchimento, para não competir com a leitura do espelho.
- **Tela de geração**: superfície calma, creme (`background`); o estado "escrevendo" é **animação**
  (texto surgindo), não spinner. O acento coral-faísca (`--color-accent`) marca "afinar voz".
- **Rascunhos**: dois cards lado a lado (empilhados no mobile), corner levemente arredondado, sem card
  dentro de card. O `body` em Geist (corpo), o ângulo de cada variante em Fraunces itálico curto.

### O gesto "Usar" → geração
Abre uma superfície dedicada (sheet no mobile, painel no desktop) que toma a tela — **não** um
modalzinho. Entra com Framer Motion (`y: 24 → 0`, fade). Já chega com a evidência visível ("Baseado em:
[tema/entrada]") para deixar claro que não é template. Os 2 rascunhos surgem com a animação de escrita.

### Os 2 rascunhos + ajuste
Cada rascunho tem um **ângulo** nomeado (ex: "o aprendizado", "quem participou") — reflete a tese de
marca (foco em processo e em quem participou, não em auto-bajulação). Abaixo: chips de ajuste ("mais
curto", "menos formal", "tira o jargão"), edição inline, "Copiar" e o controle **"soa como você?"**.

### Calibração de voz (opcional, não-bloqueante)
Um affordance leve ("afinar voz") abre o campo pra colar 1–2 amostras. Some depois de calibrado. Nunca
aparece como etapa obrigatória antes de gerar.

### Referências nomeadas
Spotify (home = motor com UI por cima, o conteúdo "já está lá"), Linear (superfícies densas mas calmas),
o próprio espelho do Borogodó (voz e disciplina anti-IA herdadas literalmente).

## 4. Anti-padrões a evitar (constituição VII)
Página/prompt em branco estilo Taplio; gerador que pede "sobre o que você quer postar?" do zero; saída
única imposta (sempre 2 variações); spinner genérico no lugar da animação de escrita; cards dentro de
cards; gradiente roxo-azul; jargão de LinkedIn na própria UI ("engaje sua audiência"); emoji decorativo;
qualquer coisa que soe gerada por IA (é o que o produto existe para evitar).

## 5. Hierarquia visual (tela de geração)
1. **"Baseado em: [evidência]"** — a prova de que não é template, primeiro.
2. **Os 2 rascunhos** (o valor).
3. **Chips de ajuste + editar + copiar** (o refino).
4. **"soa como você?"** (o sinal de voz).
5. **"afinar voz"** (refino opcional, discreto).

## 6. Motion
- Entrada da superfície de geração e revelação dos rascunhos: Framer Motion (entrada apenas).
- Animação de "escrevendo": revelação progressiva do texto (CSS/sequência), não spinner.
- Hover/focus dos chips e botões: CSS puro. Nada de JS bloqueando a main thread (Princípio IV).

## 7. Acessibilidade
Botão "Usar" e chips com label acessível; headings em ordem (h2 da superfície → conteúdo); foco visível;
superfície com focus trap + ESC; cópia confirmada com região aria-live; toques ≥ 48px; contraste AA em
todas as temperaturas; editor inline navegável por teclado.

## 8. i18n
Toda string em `pt-BR.json` (`presenca.*`): rótulos de "Usar", ângulos, chips, "soa como você?", estados
de geração e de erro, microcopy de calibração. `en.json` espelha a estrutura. Zero string hardcoded.

## 9. Microcopy-chave (pt-BR)
| Contexto | Texto |
|---|---|
| Ponto de entrada | "Usar" |
| Evidência base | "Baseado em: {tema/entrada}" |
| Estado gerando | "Escrevendo na sua voz..." |
| Seletor de formato | "Post" · "Resumo de impacto" |
| Chips de ajuste | "Mais curto" · "Menos formal" · "Tira o jargão" |
| Copiar / copiado | "Copiar" → "Copiado ✓" |
| Voz | "Soa como você?" · "Soa" · "Não soa" |
| Calibração | "Afinar voz" / "Cole 1 ou 2 textos seus para eu acertar o tom" |
| Erro de geração | "Não consegui escrever isso do jeito certo. Tenta de novo?" |
| Sem número | (nada cobrado; afirma pela evidência qualitativa) |

## 10. Checklist de saída (a validar no `/impeccable audit`)
- [ ] Nenhuma página/prompt em branco; geração sempre chega com evidência visível.
- [ ] Sempre 2 variações; nunca saída única imposta.
- [ ] Estado "escrevendo" é animação, não spinner.
- [ ] Calibração de voz é opcional e discreta, nunca bloqueia.
- [ ] Nenhum texto da UI soa como jargão de LinkedIn/IA.
- [ ] 375px revisado; toques 48px; foco visível; contraste AA; focus trap + ESC na superfície.
- [ ] Tokens de cor (sem hex); Fraunces nos ângulos/títulos; sem anti-padrões.
- [ ] Zero string hardcoded; `en.json` espelha `pt-BR.json`.
- [ ] Componentes (`GenerateSheet`, `DraftCard`, `AdjustChips`, `UsarButton`, `VoiceCalibration`)
      desenhados para reuso por 014/015.
