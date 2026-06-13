# Design Brief: Painel Principal (Espelho Vivo + Composer)

**Skill**: `/impeccable shape` | **Date**: 2026-06-07 | **Register**: product (com momentos brand na headline do espelho)

**Status**: Aguardando confirmação para implementação (ver `tasks.md`)

**Fonte**: `docs/mvp/002-panel-skeleton.md` (layout, microcopy e referências de produto).

---

## 1. Feature Summary

O painel é a casa do produto: ao mesmo tempo **artefato** (o espelho que se lê) e **superfície de
captura** (o composer que alimenta). O gesto central — jogar algo no composer embaixo e ver o
espelho se reorganizar acima — precisa parecer físico e vivo. Toda captura **resolve pra cima**:
vira reflexo que atualiza indicadores e espelho, nunca uma bolha de chat acumulada. O painel nunca
vira um log.

## 2. Primary User Action

**Capturar** pelo composer (texto ou PDF). Tudo mais — ler a headline, conferir indicadores, ver o
insight — é leitura passiva que recompensa a captura. A CTA contextual vira o **placeholder** do
composer.

## 3. Design Direction

### Tom e cena
Uma profissional abre o painel de manhã, café na mão, e em 1 segundo lê algo verdadeiro sobre si
("Você transforma complexidade em clareza — e faz isso melhor do que percebe"). Sente que o produto
trabalhou enquanto ela não estava. Caloroso, brasileiro, inteligente — nunca dashboard corporativo.

### Estratégia cromática (tokens, sem hex cru)
- **Topo (espelho)**: momento brand. Roxo-jambo presente na pill de status e no link `/espelho`;
  headline em **Fraunces** com itálico deliberado para a palavra-chave da força.
- **Meio (indicadores + insight)**: temperatura mais quente (mel/creme); o card de insight usa um
  acento (coral-faísca) no marcador "✦ Detectei algo novo".
- **Rodapé (composer)**: neutro/creme com leve `backdrop-blur`; o botão de enviar em roxo-jambo.
- Ritmo cromático por seção (Princípio VII): cada faixa tem sua temperatura; white space é elemento.

### Estados por volume (cromática do status)
| Estado | Entradas | Pill | Cor |
|---|---|---|---|
| Construindo | 1–3 | "● Em construção" | laranja |
| Tomando forma | 4–9 | "● Tomando forma" | âmbar |
| Ativo | 10+ | "● Ativo" | verde |

### Composer
Barra ancorada no rodapé (sticky), sempre visível. Textarea que cresce 1→N linhas; botões: áudio
(desabilitado, tooltip "em breve"), anexo PDF, imagem (desabilitado), enviar. A 375px continua
confortável e com toques ≥ 48px.

### O sheet de captura (`CaptureConversation`)
Toma a tela (não é modalzinho). Entra com Framer Motion (`y: 24 → 0`, fade). Fase "lendo" é
**animação**, não spinner. O reflexo aparece como um card calmo: "Entendi: …" + pílulas + **um**
movimento. Dois caminhos: "Responder" (enriquece) ou "Salvar assim" (resolve). Ao resolver, o sheet
colapsa e o painel atrás visivelmente reage.

### Referências nomeadas
Oura (insight em linguagem simples no topo), WHOOP Coach (coaching proativo sem troca de contexto),
Spotify (home = motor com UI por cima), Duolingo (streak sem cobrança — "Capturou hoje ✓").

## 4. Anti-padrões a evitar (constituição VII)
Gradiente roxo-azul genérico; Inter como única fonte; cards dentro de cards; fundo escuro com texto
neon; layout de template SaaS 2022; o painel virar feed/log de chat; spinner genérico no lugar da
animação de leitura; card de insight vazio (omitir quando não há).

## 5. Hierarquia visual (acima da dobra)
1. **Pill de status + headline do espelho** (o valor, primeiro).
2. **Strip de indicadores** (a prova de que o produto trabalha).
3. **Card de insight proativo** (quando há).
4. (dobra) Entradas recentes.
5. **Composer** ancorado, sempre presente.

## 6. Motion
- Entrada do sheet e revelação do reflexo: Framer Motion.
- Animação dos indicadores subindo após captura: transição CSS sutil (número que incrementa).
- Hover/focus: CSS puro. Nada de JS bloqueando a main thread (Princípio IV).

## 7. Acessibilidade
Headings em ordem (h1 da marca/headline → h2 seções); foco visível em todos os interativos; sheet
com focus trap + ESC; contraste AA em todas as temperaturas cromáticas; toques ≥ 48px.

## 8. i18n
Toda string em `pt-BR.json` (`panel.*`, `capture.*`), inclusive os placeholders contextuais e a
microcopy do reflexo/movimento. `en.json` espelha a estrutura.

## 9. Microcopy-chave (pt-BR)
| Contexto | Texto |
|---|---|
| Pill status | "● Em construção" / "● Tomando forma" / "● Ativo" |
| Headline sem mirror | "Seu espelho está se formando — continue capturando." |
| Reading state | "Lendo o que você me contou..." |
| Reflexo abertura | "Entendi:" |
| Botões do reflexo | "Responder" · "Salvar assim" |
| Insight (label) | "✦ Detectei algo novo esta semana" |
| Indicador tempo | "Capturou hoje ✓" / "Há {n} dias" / "Há 1 semana" |
| Áudio/imagem | tooltip "em breve" |

## 10. Checklist de saída (a validar no `/impeccable audit`)
- [ ] Valor (headline/status) acima da dobra em ≤ 1 s.
- [ ] Captura resolve pra cima; painel nunca vira log.
- [ ] Áudio/imagem desabilitados com "em breve" (costura preservada).
- [ ] Card de insight nunca vazio.
- [ ] 375px revisado; toques 48px; foco visível; contraste AA.
- [ ] Tokens de cor (sem hex); Fraunces nos títulos; sem anti-padrões.
- [ ] Zero string hardcoded.
