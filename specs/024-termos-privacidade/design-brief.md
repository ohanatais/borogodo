# Design Brief: Termos, Privacidade e Consentimento (024)

**Status**: confirmado pela Ohana (via `/impeccable shape`). Register: **product** (telas a serviço da
tarefa — familiaridade ganha, Restrained, consistência sobre surpresa). Sem probes visuais (UI de produto
restrita ao sistema existente, sem ambiguidade direcional).

## 1. Resumo

Seis superfícies utilitárias que precisam sumir dentro da tarefa: informar, coletar aceite e não assustar.
Tom da marca (revelador, caloroso) aplicado a um assunto árido — o oposto de um "muro jurídico".

## 2. Ação primária por superfície

| Superfície | O usuário precisa… |
|---|---|
| `/termos-de-uso`, `/politica-de-privacidade` | Ler com conforto; achar a versão/data |
| Aviso sign-in-wrap (cadastro) | Entender que se cadastrar = concordar, e poder abrir os docs |
| Checkbox marketing (cadastro e-mail) | Optar (ou não) sem confundir com o aceite dos termos |
| `/consentimento` (gate) | Aceitar a versão vigente em 1 clique e seguir |
| Card em `/configuracoes` | Ver quando aceitou + ligar/desligar marketing |

> **Onboarding**: NÃO tem UI de marketing (decisão da Ohana — preservar o WOW/AHA). O caminho Google só
> liga marketing nas configurações. O onboarding apenas carimba o aceite e persiste silenciosamente o
> valor de marketing vindo do checkbox do cadastro por e-mail.

## 3. Direção visual

Restrained (piso do register product). **Tokens existentes do `globals.css`, zero hex cru**
(roxo-jambo `--color-primary`, coral-faísca `--color-accent`/`--color-accent-text`, mel, verde-água,
creme `--background`). **Fraunces** só em h1–h3; **Geist Sans** no corpo, botões, labels.

Cena (força tom): *um profissional lê isto rápido, à luz do dia, entre uma coisa e outra — quer resolver e
voltar ao produto.* → calmo, claro, sem drama.

## 4. Escopo

Production-ready · mobile-first (revisão obrigatória em 375px) · i18n (namespace `legal`) · WCAG AA ·
toques ≥ 48×48px. As 6 superfícies.

## 5. Layout por superfície

- **Páginas legais** (`/termos-de-uso`, `/politica-de-privacidade`): coluna única editorial, corpo ~68ch,
  h1 Fraunces + h2 por seção, cabeçalho discreto "Versão vigente · atualizado em {data}", `Footer` público,
  link "voltar ao início". Fundo creme. Conteúdo placeholder tipado em `src/content/legal/*` (mesmo layout
  quando o texto real entrar). Componente compartilhado `LegalPage`.
- **Aviso sign-in-wrap** (`AuthForm`): linha pequena em `--muted-foreground` logo abaixo dos botões de
  cadastro; os 2 links sublinhados em `--color-primary` (contraste ok). **Não é checkbox.**
- **Checkbox marketing** (só cadastro e-mail/senha): controle real desmarcado, **visualmente separado** do
  aviso de termos (reforça o não-empacotamento da LGPD no próprio layout). Label curto + helper.
- **`/consentimento`** (gate, fora do AppShell): tela focada, centralizada — título caloroso, 1 parágrafo,
  links pros 2 docs, botão primário "Aceito e quero continuar". Calma e rápida. Fade simples respeitando
  `prefers-reduced-motion`.
- **`/configuracoes`**: 1 card novo no vocabulário dos existentes (Identity/Links), título "Privacidade e
  consentimento": linha "Você aceitou os Termos (v…) em DD/MM/AAAA" + links pros docs + o toggle de
  marketing com helper.

## 6. Estados

- **Páginas legais**: default; placeholder vs conteúdo real = mesmo layout.
- **Checkbox / toggle**: default / hover / focus / checked / disabled / saving.
- **`/consentimento`**: default, enviando, erro (falha ao gravar → permanece na tela com aviso claro).
- **Config toggle**: otimista com rollback em erro.

## 7. Interação

Toques ≥ 48px; foco visível (o `:focus-visible` global já existe). Toggle de marketing salva via server
action com feedback. Gate redireciona a `/painel` no sucesso.

## 8. Copy (pt-BR, voz da marca)

- Aviso: *"Ao continuar, você concorda com os Termos de Uso e a Política de Privacidade."*
- Marketing: *"Quero receber novidades e conteúdos do Borogodó por e-mail."* · helper: *"Pode desligar
  quando quiser nas configurações."*
- Gate título: *"Demos uma atualizada nos nossos termos"* (bump) / *"Falta só um passo"* (conta antiga).
- Botão do gate: *"Aceito e quero continuar"*.
- Texto jurídico dos documentos = **placeholder** (a Ohana escreve depois).

## 9. Refs de implementação úteis

`interaction-design.md` (forms/checkbox/toggle), `clarify.md` (microcopy), `harden.md` (estados de erro /
i18n / edge cases).

## 10. Decisões travadas

- Sign-in-wrap (sem checkbox de termos); checkbox explícito só pra marketing.
- Marketing desligado por padrão; onboarding sem UI de marketing; Google liga só em configurações.
- URLs dedicadas: `/termos-de-uso`, `/politica-de-privacidade` (`localePrefix: 'never'`, sem prefixo).
