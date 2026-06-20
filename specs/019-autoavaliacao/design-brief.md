# Design Brief — Cabine de Autoavaliação (019, modelo cockpit)

**Reescrito em 2026-06-19** (substitui o brief do modelo de geração). Gate T015 do `tasks.md`.
Saída do `/impeccable shape`. Register: **product**. Direção visual ancorada em DESIGN.md.

## 1. Feature Summary

A cabine onde a pessoa **escreve a própria autoavaliação** ancorada em fato. Ela escolhe um período,
relê **"o seu ano, em fatos"** (recap factual com fontes), escreve por seções com a **trilha de
evidências** ao lado e ajudas **não-invasivas** da IA, e recebe **uma** oferta de passo-pra-frente.
É superfície "pra dentro": a pessoa é autora, a IA ancora — nunca ghostwriter, nunca juiz.

## 2. Primary User Action

**Escrever, em primeira pessoa e com confiança, a autoavaliação do período** — sem encarar página em
branco e sem que a máquina escreva por ela. Tudo no design serve a isso: o recap tira o medo de
esquecer; a trilha mantém o fato à mão; as ajudas destravam sem tomar a caneta.

## 3. Design Direction

- **Color strategy: Restrained** (piso do register product). Base creme; **roxo-jambo** só em ação
  primária, seção ativa e foco; **coral-faísca** como faísca rara (nudge STAR, badge) ≤10%;
  **verde-água** para o estado "ancorado/evidência" e confirmações. Sem seção drenada — a cabine é um
  lugar de foco, não um hero de marca.
- **Scene sentence:** *uma profissional brasileira competente, à noite antes do ciclo de avaliação,
  um pouco ansiosa, relendo o próprio ano numa tela calma e quente que a ajuda a se enxergar sem se
  vender.* → tema **claro** (creme), baixo contraste agressivo, calor acolhedor; nada de dark "tool".
- **Anchor references:** o **editor do Notion** (escrita limpa, affordances que só aparecem quando
  precisam), o **modo de revisão do Linear** (densidade calma, estados claros), e o **caderno/brag
  document** (a página é da pessoa, a máquina é margem). Adaptação Borogodó: mais quente e
  introspectiva, tipografia Fraunces nos títulos de seção.
- **Probes de imagem:** pulados (harness sem geração de imagem nativa).

## 4. Scope

- **Fidelity:** production-ready (é a tela que vai pro PR).
- **Breadth:** um fluxo de uma rota (`/autoavaliacao`): período → recap → editor → passo-pra-frente,
  + entrada de histórico.
- **Interactivity:** shipped-quality, com estados reais (loading/empty/erro/base limitada).
- **Time intent:** polir até shippar.

## 5. Layout Strategy

Fluxo em **um eixo, dois momentos** (decisão confirmada): **lembrar → refletir no mesmo lugar**.

- **Momento "lembrar":** ao escolher o período, o recap **"o seu ano, em fatos"** aparece cheio —
  lista factual, cada item com **chip de fonte** clicável, zero adjetivo. Título em Fraunces; itens em
  Geist, densos mas respirados. Estado base limitada: reconhece e convida a registrar (link pra
  captura), nunca fabrica.
- **Transição:** ao iniciar a escrita, o recap **se recolhe e vira a trilha de evidências** — coluna
  direita no desktop (rail persistente), **gaveta colapsável** no mobile (botão "ver meu ano"). Um
  movimento só, sem trocar de tela.
- **Momento "refletir" (editor):** coluna principal com as **4 seções como andaime opcional**
  (Entregas / Impacto / Evolução / Pontos a desenvolver) — cabeçalho Fraunces por seção, textarea
  fluida por baixo. A pessoa pode pular/reordenar/deixar vazia; salva parcial a qualquer momento.
- **Hierarquia:** o texto **da pessoa** é o protagonista (maior peso, mais espaço); recap/trilha e
  ajudas da IA são margem (menor, calada, tinta-muda) — o design encena "você é o autor".
- **Passo-pra-frente:** aparece **depois**, no fim do editor, como **um** cartão de oferta (não modal),
  citando o que ela escreveu. Recusar = some sem nag.
- **Histórico:** entrada discreta (quando não há período em edição) — lista por período+data, reabre o
  texto salvo no editor.

## 6. Key States

- **Inicial (sem período):** PeriodPicker (já existe) + uma linha quente explicando a cabine.
- **Recap cheio (lembrar):** itens factuais com fonte; **base limitada** → convite a registrar.
- **Editor (refletir):** seções vazias com **sentence-stems ancorados** como placeholder/dica
  (não texto pronto); trilha ao lado; salvar parcial visível.
- **Ajuda da IA pedida:** sugestão como **cartão aceitar / rejeitar / editar** (verde-água = ancorado);
  **loading** = skeleton curto no cartão, não spinner central; **falha** = "não consegui sugerir agora"
  e a escrita segue (degrada, nunca bloqueia).
- **Nudge STAR:** dica sutil sob o parágrafo vago (coral-faísca discreto), dispensável.
- **Salvo:** confirmação calma (verde-água), sem badge de progresso/streak.
- **Passo-pra-frente:** oferta única; **aceita** → abre o plano + campo de data de revisão;
  **recusada** → some sem reprovação.
- **Erro de carga do período / sessão:** mensagem honesta em pt-BR, sem vazar detalhe.

## 7. Interaction Model

- **Período → recap:** selecionar preset/range carrega o recap (server, determinístico — rápido,
  sem espera de LLM).
- **Recap → editor:** clicar "começar a escrever" recolhe o recap na trilha (transição ~200ms,
  `prefers-reduced-motion` = corte seco).
- **Chips de fonte:** clicar abre/realça a `entry` de origem (não insere texto — só memória).
- **Ajudas inline (decisão confirmada):** cada seção tem ações opt-in **"reescrever com minhas
  palavras"** (reformula só o que ela escreveu) e **"Não sei por onde começar"** (a IA faz **1
  pergunta** ancorada no ano dela → a **resposta dela vira o rascunho** editável; nunca a IA escreve);
  **nudge STAR** aparece sozinho quando detecta vago. Toda sugestão é cartão aceitar/rejeitar/editar —
  a IA **nunca** insere/sobrescreve. (Modo interno `unblock` no código; o rótulo visível é "Não sei por
  onde começar" porque "destravar" não diz à pessoa o que de fato acontece.)
- **Salvar:** autosave leve + botão explícito; status `draft`. Copiar quando pronta (`copied`).
- **Passo-pra-frente:** botão único ao fim; gera o plano ancorado; aceitar grava a data de revisão.

## 8. Content Requirements (pt-BR, voz Borogodó)

- Título da cabine + subtítulo quente ("relembre o seu ano e escreva do seu jeito").
- Recap: rótulo **"o seu ano, em fatos"**; item = fato + fonte; base limitada = "ainda tem pouco aqui
  pra colher — que tal registrar antes?".
- Seções: nomes + **sentence-stems** ancorados ("Em [projeto/mês], eu…", "O resultado de [registro]
  foi…").
- Ajudas: "reescrever com minhas palavras", "Não sei por onde começar" (a IA faz 1 pergunta; a resposta
  da pessoa vira o rascunho), nudge "qual foi o resultado / número / antes-depois?".
- Estados de IA: loading, falha ("não consegui sugerir agora; segue escrevendo"), aceitar/rejeitar.
- Passo-pra-frente: oferta citando a pessoa ("você escreveu que quer afiar X — vira um plano?");
  rótulo da data de revisão; texto de recusa silenciosa.
- Histórico: título, vazio ("suas autoavaliações vão aparecer aqui").
- **Bans de copy:** sem travessão, sem buzzword, sem "potencialize/transforme"; nada que soe a nota ou
  avaliação da máquina.

## 9. Recommended References (na implementação)

- `interaction-design.md` — o editor é form-heavy com estados de IA (aceitar/rejeitar, degradação).
- `layout.md` — o eixo um-lugar/dois-momentos e o rail↔gaveta responsivo.
- `clarify.md` — a microcopy carrega a voz e os guarda-corpos (não soar juiz).
- `animate.md` — a transição recap→trilha (sutil, com reduced-motion).

## 10. Open Questions

Nenhuma bloqueante. Defaults assumidos: autosave leve além do botão salvar; chip de fonte realça a
entry sem navegar pra fora da cabine; passo-pra-frente como cartão inline (não modal). Ajusto na
implementação se algo se provar errado no viewport de 375px.
