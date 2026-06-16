# Shape Brief: /registros — Feed de Registros + Grade-Faísca

**Status**: ✅ Aprovado  
**Data**: 2026-06-16  
**Feature**: 017-feed-registros

---

## 1. Feature Summary

`/registros` é o arquivo vivo da pessoa — o equivalente ao histórico de chats, mas de
carreira. Enquanto o `/historico` sintetiza e curada (empresa, cargo, projeto), o
`/registros` mostra tudo, cru, contável. É a prova de que o trabalho não é invisível.
Serve Bruno que precisa achar um número, Ana que filtra o trimestre para um review, Clara
que quer ver a pilha crescer.

## 2. Primary User Action

Abrir o feed e ver imediatamente que o trabalho está lá, registrado, acumulado — depois
buscar ou filtrar o que precisa.

## 3. Design Direction

- **Registro do produto**: Restrained. Superfície de tarefa, não de apresentação. O produto
  desaparece na tarefa.
- **Cena**: Ana em casa, laptop, numa tarde de terça-feira, preparando o review de trimestre.
  Focada, quer achar os números certos rápido. Um produto que faz o trabalho pesado sem ser
  o centro da atenção.
- **Âncoras**: Linear (densidade de lista, riqueza de metadados sem ruído), GitHub activity
  graph (mecânica de acumulação/orgulho), Notion database (filtragem direta, estado na URL).
- **Não é**: Dashboard com KPIs. Timeline curada. Feed com espaços poéticos — este é o
  arquivo, não a galeria.

## 4. Scope

- Fidelidade: produção
- Breadth: rota `/registros` completa + ajuste no Painel (bloco "Seus registros")
- Interatividade: feed com paginação, filtros na URL, exclusão com confirmação, clique na
  grade filtra o feed

## 5. Layout Strategy

### Mobile (< 768px)

```
┌─────────────────────────────────────────────┐
│  [Seus registros]  [Quando anotei | Aconteceu]
│  ┌─ Grade compacta (13 semanas, horizontal) ┐│
│  │ ✦ ✦ · · ✦ · · ✦ ✦ ✦ · ✦ ✦ ✦ · · · · · │
│  └──────────────────────────────────────────┘│
│  [Busca ____________________] [Filtros ▾]    │
│  ─────────────────────────────────────────── │
│  Card colapsado                              │
│  Card colapsado                              │
│  Card expandido ──────────────────────────  │
│    campos · Usar · Excluir                   │
│  ─────────────────────────────────────────── │
│  [Carregar mais]                             │
└─────────────────────────────────────────────┘
```

### Desktop (≥ 768px)

```
┌────────────────────────────────────────────────────────┐
│ [Seus registros]  [Eixo toggle]          │  atividade  │
│ [Busca] [Filtros inline]                 │ Jun ✦ · ✦ ✦ │
│ ──────────────────────────────────────── │ Mai ✦ ✦ · ✦ │
│ Card colapsado                           │ Abr · · ✦ · │
│ Card colapsado                           │ Mar ✦ · · ✦ │
│ Card expandido ──────────────────────    │ Fev · · · · │
│   campos · Usar · Excluir                │ Jan ✦ · ✦ · │
│ ────────────────────────────────────     │ ...         │
│ [Carregar mais]                          │ ↑ recente   │
└──────────────────────────────────────────────────────┘
```

**Hierarquia**: Título leve (Fraunces, não herói) → eixo toggle → filtros compactos → feed
de cards. A grade não compete com o feed — é sticky lateral no desktop, horizontal compacta
no mobile.

## 6. Key States

| Estado | O que o usuário vê e sente |
|---|---|
| Default (com registros) | Feed com cards colapsados + grade de atividade visível; sem filtros ativos |
| Sem registros (1ª vez) | Estado de boas-vindas com CTA para capturar — tom: "seu arquivo começa agora" |
| Massa crítica insuficiente | Grade não aparece — o feed sozinho carrega o valor |
| Card colapsado | Título bold (1 linha) + ícone de origem + data relativa + badge de métrica |
| Card expandido | Todos os campos + thumbnail + "Usar" + "Excluir" |
| Delete — confirmação | AlertDialog: definitivo, rascunhos na Presença não somem |
| Busca/filtros ativos | Indicador visual de filtros ativos + botão "Limpar filtros" |
| Sem resultado para filtro | Mensagem honesta + CTA para limpar (nunca parece erro) |
| Loading | Skeleton de lista (formas dos cards antes do conteúdo) |
| Célula de grade clicada | Feed filtra pelo período; célula fica visualmente ativa |

## 7. Interaction Model

- **Expand/collapse card**: tap/click em qualquer área do card colapsado. `aria-expanded`.
  Animação: CSS `grid-template-rows: 0fr → 1fr` com `overflow: hidden` (CSS-only, sem
  Framer Motion — micro-interação, não entrada).
- **Eixo toggle**: duas opções pill-style. Ao clicar, URL muda (`?axis=`), feed recarrega.
  Transição 150ms ease-out.
- **Busca**: input com debounce 300ms. Atualiza URL e filtra. Botão × visível quando não vazia.
- **Filtros mobile**: botão "Filtros" abre bottom sheet (shadcn Sheet). Desktop: dropdowns
  inline acima do feed.
- **Grade mobile**: scroll horizontal (sem scrollbar visível). Tap em faísca = filtro de
  período → URL update.
- **Grade desktop**: sticky lateral, scrolla com o container mas presa à viewport. Hover
  mostra tooltip (data + contagem). Click = filtro de período.
- **Hover na estrela (desktop)**: scale 1.4 com transition 150ms ease-out (CSS-only).
- **Excluir**: botão "Excluir" dentro do card expandido → AlertDialog → remoção otimista
  (opacity 0 + height 0 em 200ms).
- **"Ver tudo →" no Painel**: link simples para `/registros`.

## 8. Grade-Faísca — Decisões Cravadas

### Símbolo: ✦ (U+2726 — Black Four Pointed Star)

A faísca de quatro pontas é literalmente a forma do coral-faísca do produto. Evita copiar
o quadrado do GitHub e fica semanticamente alinhado com o nome "faísca" e com o token
`--color-accent` (coral-faísca).

### Granularidade: dia (célula = 1 dia, linha = 1 semana)

**Decisão**: célula = dia, linha = semana. Permite ver padrões de hábito (qual dia da semana
a pessoa captura mais). Layout: 7 colunas (Seg–Dom) × N linhas (semanas), mais recente no
topo.

### Intensidade: tamanho + cor simultâneos

| Contagem | Tamanho ✦ | Cor | Opacidade |
|---|---|---|---|
| 0 | 8px | `--color-primary` muito claro | 0.3 |
| 1 | 9px | roxo-jambo claro | 0.85 |
| 2–3 | 11px | roxo-jambo médio | 1.0 |
| 4+ | 13px | roxo-jambo pleno | 1.0 |

A estrela **cresce e satura** simultaneamente — o volume do dia é legível num relance mesmo
sem legenda.

### Layout: híbrido responsivo

- **Desktop (≥ 768px)**: faixa vertical sticky à direita do feed. Largura ≈ 100px. Semanas
  empilhadas do topo (mais recente) ao fundo (mais antigo). Label de mês à esquerda (Seg–Dom
  no cabeçalho). Janela: 52 semanas (12 meses). Não scrollável — fica presa à viewport junto
  com o conteúdo do feed.
- **Mobile (< 768px)**: faixa horizontal compacta acima dos filtros. Scroll horizontal suave
  (sem scrollbar). Janela: 13 semanas (3 meses). Mais recente à direita.

### Threshold de massa crítica

Grade só aparece quando `≥ 5 registros em dias distintos nos últimos 90 dias`
(constante `GRID_MIN_DISTINCT_DAYS = 5`). Abaixo disso, o feed cru sozinho carrega o valor —
a grade não aparece nem vazia, nem triste.

## 9. Content Requirements

**Cards colapsados**:
- Título (máx 80 chars — IA ou fallback determinístico)
- Ícone de origem (`📝 text · 🎙️ audio · 📄 LinkedIn · 🖼️ imagem`)
- Data relativa ("hoje", "ontem", "há 3 dias", "há 2 semanas"; data absoluta para > 30 dias)
- Badge de métrica quando presente (pill coral pequeno)

**Cards expandidos** (adicional):
- `what_i_did` completo
- Campos estruturados (impacto, decisão, aprendizado) quando preenchidos
- Thumbnail quando `evidences` tem imagem
- Empresa + cargo quando presentes
- "Usar" (botão secondary roxo-jambo) + "Excluir" (ghost apenas texto — sem ícone de lixeira)

**Microcopy**:
- Estado vazio: "Seu arquivo começa agora. Cada captura vai aparecer aqui."
- Sem resultado: "Nenhum registro encontrado para esse filtro."
- Delete title: "Excluir este registro?"
- Delete description: "Essa ação não pode ser desfeita. Os rascunhos gerados a partir dele
  continuam na Presença."
- "Ver tudo →" no painel

## 10. Recommended References

- `reference/layout.md` — estrutura desktop/mobile (layout de duas colunas + faixa sticky)
- `reference/animate.md` — expand/collapse do card e remoção otimista
- `reference/harden.md` — estados de erro, loading skeletons, edge cases antes do PR
