# Design Brief: Captura v2 — Captura sem atrito

**Skill**: `/impeccable shape` | **Date**: 2026-06-15 | **Register**: product (com a voz acolhedora do espelho)

**Status**: Planejamento — aguardando implementação (ver [tasks.md](./tasks.md)). Superfícies novas:
**ressurgimento (US2)** e **gravação (US3)**. US1 (colar) e US4 (pergunta) reusam superfícies existentes.

**Fonte**: [spec.md](./spec.md), [plan.md](./plan.md), [research.md](./research.md),
`.impeccable/design.json` (tokens oklch, Fraunces/Geist, roxo-jambo), `docs/discovery-retencao-e-conteudo.md`.

---

## 1. Feature Summary

A Captura v2 ataca o gargalo de retenção no **input**. O sentimento alvo tem dois lados: na captura,
**"eu só trouxe o que já produzi e virou registro, sem ter que redigir nada"**; no retorno, **"abri o
app e ele estava vivo — mostrou algo meu, verdadeiro, sem me cobrar"**. Nunca a página em branco que
paralisa, nunca a cobrança que dá culpa.

## 2. Primary User Action

Dois gestos, um por metade do loop:
- **Trazer** material pronto (colar / falar) → vira entrada sem redigir. (US1/US3)
- **Voltar** e ver algo vivo (ressurgimento por delta) → reconhecer uma vitória e cair na captura. (US2)

Tudo mais (desfazer o lote, editar a transcrição, responder a pergunta cirúrgica) é refino sobre esses
dois gestos.

## 3. Design Direction

### 3.1 Ressurgimento — `ReturnHighlight` (US2, superfície nova)

**Onde**: topo do painel, acima do composer. É a **primeira coisa** que a pessoa vê ao voltar.

**Cena**: a pessoa volta numa sexta à tarde. Em vez de um painel parado (ou pior, "faz 5 dias que você
não escreve"), o topo diz, na voz do espelho: *"Essa semana você fechou a migração do checkout."* Ela
reconhece, sente que o app acompanhou, e o convite a registrar o resto da semana vem leve.

**Dois ramos, duas temperaturas cromáticas** (token, sem hex cru):
- **Tem novidade** → acento **roxo-jambo** (`--color-primary`), fresco/ativo. Frase ancorada nas
  entradas novas. Quando o **espelho regenerou**, acompanha um aha de força com o **coral-faísca**
  (`--color-accent`) como faísca pontual ("isso reforça sua força em {tema}") — coral é pontuação,
  nunca preenchimento (Regra do Coral, ≤10%). Sem regeneração: mostra a novidade **sem** afirmar força nova.
- **Sem novidade** → acento **mel** (`--color-*` mel), calor de nostalgia ("há 1 ano você entregou {Z}").
  Embaixo, o convite leve a registrar algo novo.

**Forma**: um bloco caloroso sobre superfície creme, raio 12px, plano em repouso (Flat-Until-Lifted). A
frase de vitória em **Fraunces** (a voz do produto); o rótulo de contexto ("essa semana" / "há 1 ano")
em Geist label. **Não** é o template de hero-metric (número gigante + gradiente) — isso é anti-padrão.
É uma frase com a cara de quem te conhece.

**O convite → captura** (FR-009): um botão que **cai direto no composer** (foca o textarea / abre a
captura). Ghost ou primário discreto, nunca competindo com a leitura da vitória.

**Nunca página em branco**: banco vazio → convite de boas-vindas ("vamos registrar a primeira?"), não
um espaço morto.

### 3.2 Gravação — `AudioRecorder` (US3, superfície nova)

**Onde**: abre a partir do botão de microfone no `CaptureComposer` (hoje stub `disabled`).

**Princípio honesto do v1**: a Web Speech entrega **texto ao vivo**, não um clipe. Então a UI nunca
promete "reouvir o áudio" — ela mostra o **texto surgindo enquanto a pessoa fala**, e isso *é* a
gravação. "Reouvir" vira "ler o texto"; "regravar" vira "limpar e falar de novo".

**Estados e controles** (botões **explícitos**, FR-012b — nunca segurar-e-arrastar):
1. **Parado/pronto**: ícone de microfone no composer.
2. **Gravando**: texto ao vivo aparecendo + botões **Parar** e **Cancelar**. Indicador "ouvindo" é uma
   **pulsação calma** com o coral-faísca (a faísca do momento ao vivo), respeitando `prefers-reduced-motion`.
3. **Parado com texto**: a transcrição cai no campo, **editável**, + botão **Regravar** (descarta e
   recomeça) e o caminho normal de captura (segue para a extração da US1).

**Degradação honesta** (FR-013): onde a Web Speech é fraca/ausente (Safari/iPhone), o microfone se
apresenta **limitado/indisponível** com microcopy honesta — e o **texto/colar continua 100% funcional**.
Nunca um botão que parece funcionar e falha.

### 3.3 Colar — `CaptureComposer` + `BatchSummary` (US1, reuso + 1 card novo)

**Enquadramento de artefato**: o placeholder do composer convida o material pronto — *"Cole uma
transcrição, um e-mail, uma conversa…"* — deixando claro que não é diário.

**Aviso de privacidade** (FR-019): **leve e discreto**, próximo ao campo (não um banner assustador):
*"Cole só o que você pode guardar."* Sem detecção de PII no v1 (decisão de clarify) — RLS é a proteção.

**`BatchSummary`** (card novo): após colar, uma confirmação calma *"Criei 3 entradas"* com **desfazer**
alcançável (não um toast que some rápido demais para clicar). Reusa a estética dos cards. Desfazer
remove o lote inteiro num toque.

### 3.4 Pergunta cirúrgica assíncrona (US4, reuso da trilha de insight)

Ressurge **uma** pergunta na superfície de insight do painel (`ProactiveInsightCard`), com o **padrão de
input do `ReflectionCard`**: a pergunta curta ("teve algum número ou prazo nisso?") + um campo + enviar,
+ dispensar. Calma, **uma por vez**, fora do momento da captura. Responder enriquece a entrada e fecha;
ignorar não cobra.

## 4. Anti-padrões a evitar (constituição VII)

- **Cobrança/culpa** no ressurgimento ("você sumiu", "faz X dias") — é o oposito da tese do produto.
- **Análise fabricada** sem delta real — sem novidade, vira convite, nunca insight inventado.
- **Hero-metric template** (número gigante + gradiente roxo-azul) no ressurgimento.
- **Clichê de REC** alarmante (bolinha vermelha piscando) — o "ao vivo" é a faísca calma do coral.
- **Botão de áudio que promete e quebra** em Safari — honestidade antes de cobertura.
- **Página/prompt em branco** em qualquer ramo.
- **Toast de desfazer que some rápido** — o desfazer precisa ser alcançável.
- Qualquer microcopy que soe traduzida ou jargão de IA/LinkedIn.

## 5. Hierarquia visual

**Painel (topo)**: 1. `ReturnHighlight` (a vitória / a novidade) → 2. composer (a captura) →
3. pergunta cirúrgica (se houver) → 4. resto do painel.

**Composer em gravação**: 1. texto ao vivo (o que está saindo) → 2. Parar/Cancelar → 3. (ao parar)
Regravar + enviar.

## 6. Motion

- Entrada do `ReturnHighlight` e do `AudioRecorder`: Framer Motion (`y: 16→0`, fade, `ease-out-expressive`,
  só entrada).
- Pulsação "ouvindo": CSS, calma, **desligada** sob `prefers-reduced-motion`.
- Texto da transcrição surgindo: atualização incremental do campo (resultados interim da Web Speech),
  não spinner.
- Hover/focus de botões/chips: CSS puro (Princípio IV — nada bloqueando a main thread).

## 7. Acessibilidade (constituição V)

- **Gravação**: botões Parar/Cancelar/Regravar com label acessível, operáveis por **teclado** (Tab/Enter)
  e **leitor de tela**; estado de gravação anunciado (`aria-live`); a transcrição ao vivo numa região
  `aria-live="polite"`; toques ≥ 48px.
- **Ressurgimento**: heading em ordem; convite é um botão real (foco visível); contraste AA nas duas
  temperaturas (atenção ao mel e ao cinza-mudo sobre creme — perto do limite 4.5:1).
- **Pergunta cirúrgica**: input rotulado, enviar/dispensar por teclado.
- **Desfazer**: alcançável por teclado, com confirmação por `aria-live`.

## 8. i18n (constituição IX)

Toda string em `pt-BR.json`, `en.json` espelhando. Namespaces:
- `capture.*` — enquadramento de artefato, aviso de privacidade, microcopy de gravação/erros de áudio,
  `BatchSummary` ("criei N entradas" / desfazer).
- `panel.*` — ressurgimento (os dois ramos), aha de força, convite, estado de boas-vindas.

## 9. Microcopy-chave (pt-BR)

| Contexto | Texto |
|---|---|
| Placeholder do composer | "Cole uma transcrição, um e-mail, uma conversa…" |
| Aviso de privacidade | "Cole só o que você pode guardar." |
| Resumo do lote | "Criei {n} entradas" · "Desfazer" |
| Sem conquista no texto | "Não encontrei uma vitória clara aqui — quer contar com suas palavras?" |
| Limite de tamanho | "Esse texto é grande demais pra uma captura. Quebra em partes?" |
| Ressurgir — tem novidade | "Essa semana você fechou {evidência}." |
| Ressurgir — aha de força | "Isso reforça sua força em {tema}." (só se o espelho regenerou) |
| Ressurgir — vitória antiga | "Há {tempo} você entregou {evidência}." |
| Convite a registrar | "Quer registrar algo novo?" |
| Boas-vindas (banco vazio) | "Vamos registrar a primeira conquista?" |
| Gravação — ouvindo | "Ouvindo…" |
| Gravação — controles | "Parar" · "Cancelar" · "Regravar" |
| Áudio sem suporte | "Seu navegador não transcreve bem por aqui — pode colar ou escrever." |
| Pergunta cirúrgica | "Teve algum número ou prazo nisso?" |

## 10. Checklist de saída (a validar no `/impeccable audit`)

- [ ] Ressurgimento nunca cobra nem dá culpa; nenhuma análise fabricada sem delta.
- [ ] Os dois ramos do delta têm temperatura cromática própria; coral só como faísca (≤10%).
- [ ] Aha de força só aparece quando o espelho regenerou.
- [ ] Gravação: botões explícitos rotulados, por teclado e leitor de tela; "ao vivo" é faísca calma, não REC vermelho.
- [ ] Áudio degrada com honestidade em Safari/iPhone; texto sempre funciona.
- [ ] `BatchSummary` com desfazer alcançável (não toast efêmero); aviso de privacidade leve.
- [ ] Nunca página em branco (incl. banco vazio → boas-vindas).
- [ ] 375px revisado; toques 48px; foco visível; contraste AA; `prefers-reduced-motion` respeitado.
- [ ] Tokens de cor (sem hex); Fraunces nas frases de vitória; sem anti-padrões (hero-metric, gradiente, jargão).
- [ ] Zero string hardcoded; `en.json` espelha `pt-BR.json`.
- [ ] Componentes novos (`ReturnHighlight`, `AudioRecorder`, `BatchSummary`) desenhados para reuso e coesos com o design system.
