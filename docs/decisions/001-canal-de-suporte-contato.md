# 001 — Canal de suporte/contato (pré-launch)

- **Data:** 2026-06-22
- **Status:** decidido
- **Objetivo core que isso serve:** retenção + validação de aha. No pré-launch, o canal de
  suporte é o instrumento que transforma churn invisível em aprendizado. Num produto de
  carreira, bug silencioso (ex.: o espelho erra um fato) é fatal: sem canal, a pessoa não
  reclama, some, e o sinal mais valioso da fase se perde.

## Contexto
Issue #35 (`pre-launch`): o usuário precisa de um jeito de reportar problema/pedir ajuda.
Estudo do real: **não existe nenhum canal hoje** — sem rodapé, sem `mailto:`, sem e-mail de
suporte no app ou na LP (grep em `src/`). É greenfield. A Ohana levantou duas restrições de
UX que moldaram a decisão: odeia `mailto:` (delega pro handler nativo do SO — abre o Mail.app
que ela não usa, experiência imprevisível pro usuário) e acha formulários chatos.

## Decisão
**Seção/página de contato que mostra o e-mail `admin@borogodo.ai` como texto + botão "copiar"
(gesto principal), com link de LinkedIn como canal secundário e microcopy de SLA honesto
("Sou eu que respondo, em até 2 dias úteis").** Acessível pelo rodapé da LP e pela Central de
Configurações (`/configuracoes`). **Sem `mailto:` forçado e sem formulário.**

## Alternativas consideradas
- **A. `mailto:` no rodapé/config** — custo zero, no ar hoje. Descartada como gesto principal:
  abre handler nativo do SO (a dor específica da Ohana); pode ficar como link secundário
  opcional ("ou abra no seu app").
- **B. Form in-app com contexto** (mensagem + tela/estado) — captura contexto técnico, mas é o
  que a Ohana acha chato e é over-engineer pro volume pré-launch. Caminho de evolução futuro.
- **C. Widget de terceiro** (Crisp/Tawk) — chat pronto, mas peso na página, LGPD e mais um SaaS
  pra manter; dissonante com produto solo enxuto. Descartada.
- **D. Não fazer / esperar** — descartada: pré-launch sem canal = churn cego, mata o principal
  valor da fase.
- **★ Escolhida: variação de A sem o atrito do `mailto:`** — e-mail como texto copiável +
  LinkedIn. Resolve as duas dores da Ohana, custo baixíssimo, liga o sinal hoje.

## Por que esta (e o steelman do oposto)
É a coisa certa pré-launch: o gargalo é *ter* o canal, não a eficiência dele. Copiar-e-colar
não terceiriza a experiência pro device (ao contrário do `mailto:`) e não impõe o atrito de um
form. A resposta pessoal de uma fundadora é encantamento, não fraqueza. LinkedIn é on-brand
(produto de carreira, build-in-public) e baixa a barreira de quem vive lá.

**Steelman do oposto (form / opção B agora):** e-mail perde o contexto — você recebe "não
funcionou" sem saber tela, estado nem erro, e gasta idas-e-voltas que um form capturaria de
graça. Num produto cujo bug crítico é "o espelho errou um fato", saber *qual entrada/qual tela*
vale ouro. Se o volume aparecer no soft-launch, B se paga. Fica registrado como evolução natural.

## Riscos e o que os mitiga
1. **Canal que ninguém monitora** (o maior). O e-mail só vale se cair num lugar que a Ohana
   abre com frequência. Mitiga: definir roteamento de `admin@borogodo.ai` e rotina de checagem
   antes de publicar. SLA informal honesto na microcopy fixa a promessa.
2. **LinkedIn limita DM de não-conexão** (vira "pedir conexão + nota", nem todo mundo completa).
   Mitiga: LinkedIn é secundário ("papo/feedback"), nunca o canal de bug.
3. **Mistura suporte com perfil pessoal da Ohana** no LinkedIn. Aceito no pré-launch.

### Pendências de configuração (resolvidas 2026-06-22)
- [x] **`admin@borogodo.ai` existe e recebe?** Sim — redireciona para o e-mail pessoal da fundadora.
- [x] **URL do perfil de LinkedIn** da Ohana: `https://www.linkedin.com/in/ohana-taís/`.

## Como saber se acertamos
Sinal: chegam contatos reais (bug/dúvida/feedback) e cada um vira aprendizado — idealmente uma
issue no GitHub. Reavaliar quando o volume passar do que dá pra responder no e-mail à mão
(gatilho para a opção B / form com contexto).

## Próximo passo
Handoff pro `/speckit-specify`:

> `/speckit-specify "Canal de contato/suporte pré-launch: uma seção de contato (página ou bloco) acessível pelo rodapé da landing page e pela Central de Configurações (/configuracoes), exibindo o e-mail admin@borogodo.ai como texto com botão 'copiar e-mail' (sem mailto: forçado), um link secundário para o LinkedIn da fundadora, e microcopy de SLA informal ('Sou eu que respondo, em até 2 dias úteis'). Sem formulário. i18n pt-BR/en. Antes de publicar: confirmar que admin@borogodo.ai recebe e definir a URL do LinkedIn."`
