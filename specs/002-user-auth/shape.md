# Design Brief: Autenticação e Sessão

**Skill**: `/impeccable shape` | **Date**: 2026-06-06 | **Register**: product (com override brand na /login)

**Status**: Aguardando confirmação para implementação (T020, T026 no tasks.md)

---

## 1. Feature Summary

Duas telas para o módulo de autenticação do Borogodó:

**/login** — ponto de entrada unificado para novos e usuários retornantes. É um momento de marca: a primeira coisa que o usuário vê depois de clicar em "Criar conta" na LP. Deve ser quente, focada, e distintamente brasileira — não uma tela de auth genérica.

**/painel** — placeholder temporário do dashboard. Fecha o loop de auth: confirma que o usuário chegou, exibe nome, oferece logout. Será substituído pelo painel completo no módulo futuro.

---

## 2. Primary User Action

- **/login**: Clicar em "Entrar com Google" — o caminho preferencial. Tudo mais é secundário.
- **/painel**: Confirmar chegada ("estou no lugar certo") e, se quiser, testar o logout.

---

## 3. Design Direction

### /login — Committed color strategy

A /login é brand-adjacent: primeiro toque com o produto depois da LP. Roxo-jambo presente e confiante — claramente Borogodó, não um formulário genérico.

**Cena**: Uma profissional brasileira, noite, luz de mesa quente, abrindo uma aba que ela está curiosa há dias. Esperançosa, levemente cautelosa, prestes a confiar ao produto sua história profissional.

**Override de register**: `brand` para o headline (Fraunces, mistura bold + itálico). Resto da tela segue `product` (componentes consistentes, sem decoração gratuita).

### /painel — Restrained

App shell puro. Roxo-jambo apenas na marca e no estado hover/focus do botão de logout. A tela é uma zona de pouso — não precisa de drama.

### Referências nomeadas

- **Loom auth** — card centralizado, headline de marca forte, CTA único e proeminente, sem poluição visual
- **Linear app shell** — top bar confiante e esparso, nada de decoração, foco no conteúdo
- **Nubank** (app) — calor brasileiro dentro de product UI mínimo; nome do usuário e ação principal, nada mais

---

## 4. Scope

- Fidelidade: production-ready
- Breadth: duas telas (/login e /painel)
- Interatividade: rendered estático (sem prototype)
- Mobile-first: 375px como base, expansão md/lg

---

## 5. Layout Strategy

### /login

Card centralizado em fundo creme. Mobile: card preenche o viewport (padding 24px). Desktop: card max-width 420px, centralizado vertical e horizontalmente (min-h-screen flex items-center justify-center).

**Hierarquia visual de cima para baixo:**
1. LogoMark + wordmark "borogodó" (pequeno, centralizado, topo)
2. Headline em Fraunces (bold + itálico na palavra de ênfase)
3. Tab switcher "Entrar | Criar conta" (controle de modo)
4. Google button (destaque visual máximo — caminho P1)
5. Divider "— ou —"
6. Campos do formulário (secundários visualmente)
7. Botão de submit em roxo-jambo
8. Link auxiliar (reenviar e-mail, etc.)

Sem split esquerda/direita. A tela é pequena, focada e calorosa — não precisa de layout editorial.

### /painel

Top bar full-width: 56px de altura, fundo branco, 1px borda-bottom em `--border`.

**Distribuição do top bar:**
- Esquerda: LogoMark pequeno
- Centro-esquerda: "Olá, [nome]" em Geist Sans 500
- Direita: botão "Sair" (ghost, roxo-jambo text)

Conteúdo: fundo creme, coluna centralizada, max-width 480px, espaçamento generoso.

---

## 6. Key States

### /login

| Estado | O que o usuário vê | O que o usuário sente |
|--------|-------------------|-----------------------|
| Default (login) | E-mail + Senha, Google button, aba "Entrar" ativa | "Consigo entrar rápido" |
| Signup mode | Nome + E-mail + Senha, Google button, aba "Criar conta" ativa | "Fácil — só o essencial" |
| Loading (form submit) | Botão com spinner inline, campos disabled | "Está processando" |
| Erro de campo | Mensagem inline abaixo do campo em vermelho-alerta | "Entendo o que errei" |
| Erro de rede | Aviso inline acima do botão de submit | "Sei que pode tentar de novo" |
| Confirmação (e-mail enviado) | Google button + form substituídos pela tela de confirmação | "Está certo, só checar e-mail" |

### /painel

| Estado | O que o usuário vê |
|--------|--------------------|
| Default | Top bar com nome + logout, área de conteúdo com placeholder |

---

## 7. Interaction Model

**Mode toggle** — switcher de abas ("Entrar" | "Criar conta") acima do Google button. Clicar troca os campos visíveis e o headline. Sem navegação de rota — `router.replace` com `?mode=signup` ou `?mode=login`.

**Google button** — visível e funcional nos dois modos. Click → redirect OAuth. Sem loading state na página (o redirect acontece).

**Formulário** — validação client-side no blur de cada campo. Erros inline embaixo do campo. Submit → loading state no botão. Sucesso: signup → tela de confirmação; login → `router.push('/painel')`.

**Logout** — click no botão → Server Action → redirect para /login. Sem modal de confirmação (ação reversível — só re-logar).

---

## 8. Content Requirements

### Headlines (Fraunces, mistura bold + itálico)

```html
<!-- Signup -->
<h1>Seu borogodó <em>começa aqui</em>.</h1>

<!-- Login -->  
<h1>Bem-vindo <em>de volta</em>.</h1>
```

O `<em>` renderiza em `font-weight: 400; font-style: italic` dentro do `h1` que carrega `font-weight: 700`. Essa é a assinatura tipográfica da marca.

### Microcopy completo

Ver `contracts/ui-contracts.md` — tabela de chaves `auth.*` e `painel.*`. Zero strings hardcoded: tudo via `useTranslations()` ou `await getTranslations()`.

### Estados de erro (coloquial, nunca genérico)

- E-mail duplicado: "Esse e-mail já tem uma conta. Quer entrar?"
- Senha incorreta: "Senha incorreta" (simples, sem revelar se o e-mail existe)
- E-mail não confirmado: "Confirme seu e-mail antes de entrar"
- Nome vazio: "Nome é obrigatório"
- Senha curta: "A senha precisa ter pelo menos 8 caracteres"
- Rede: "Erro de conexão. Tente novamente"

### /painel

- Headline: "Seu painel está chegando." (Fraunces)
- Corpo: "Por enquanto, tudo certo." (Geist Sans)
- Greeting no top bar: "Olá, [nome]"

---

## 9. Decisões de componente

### Google button

Seguir as brand guidelines do Google: fundo branco, ícone "G" do Google no lado esquerdo, texto "Entrar com Google" em Geist Sans 500 (tinta), 1px borda em `--border`. Height 48px (touch target mínimo). Full-width. `border-radius: 8px`. Hover: background `oklch(98% 0.008 90)` (creme leve) + shadow warm.

Justificativa: a conformidade com o Google Guidelines é requisito de aprovação na Google Cloud Console. A presença de marca ocorre no headline Fraunces + no tab switcher roxo-jambo + no submit button roxo-jambo.

### Submit button

Roxo-jambo fill, roxo-jambo-fg text. Full-width. Height 48px (mobile touch target). `border-radius: 8px`. "Criar conta" ou "Entrar" dependendo do modo.

### Tab switcher (modo login/signup)

Pill container com fundo `--color-lilas-nevoa`. Duas tabs lado a lado. Aba ativa: fundo `--color-primary`, texto `--color-primary-fg`. Aba inativa: texto `--muted-foreground`. Transição: `background-color 150ms ease-out`. Padding: 4px dentro do container; 10px/16px em cada tab. `border-radius: 9999px` no container, `9999px` nas tabs também.

### Card da tela /login

Background `--card` (branco). `border-radius: 12px`. Shadow: `0 4px 24px oklch(42% 0.19 320 / 0.08)` (sombra quente, roxo-jambo). Padding: 32px desktop, 24px mobile.

### Tela de confirmação (e-mail enviado)

Dentro do card, substituir Google + form. Centralizado. Ícone envelope (Lucide `MailCheck`) em roxo-jambo. Headline em Fraunces 600. Corpo em Geist Sans. Link "Reenviar e-mail" em ghost/texto roxo-jambo abaixo.

---

## 10. Animações

Seguir Constituição Princípio IV e VIII:

- **Mode toggle**: `transition: opacity 150ms ease-out` nos campos que entram/saem. Não animar height.
- **Erro inline**: aparece com `opacity: 0 → 1` em 120ms. Sem slide.
- **Card**: sem entrance animation (product UI, não LP).
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` — todas as transições ficam `duration: 0ms`.

---

## 11. Mobile-first: 375px

- Card sem border-radius no mobile (ocupa viewport inteiro com padding 24px)
- Fonte do headline: Fraunces 600, 28px fixo no mobile (sem clamp — product UI)
- Inputs height 48px no mobile (touch target garantido)
- Botões height 48px no mobile
- Keyboard: `inputMode="email"` nos campos de e-mail, `type="password"` no senha

---

## 12. Acessibilidade

- `<label>` associado a cada input via `htmlFor` + `id`
- `aria-describedby` apontando para a mensagem de erro quando presente
- `aria-live="polite"` no container de erros inline
- Focus order: tab switcher → Google button → campos → submit
- Focus ring: 2px roxo-jambo, 2px offset (já definido em globals.css via `:focus-visible`)
- Contraste: tinta (`oklch(18% 0.02 260)`) em creme (`oklch(98% 0.008 90)`) → passa 4.5:1 com folga

---

## 13. Referências de implementação

Quando retornar, implementar seguindo:
- Tasks T015-T021 no tasks.md (fase /login + impeccable shape feedback)
- Tasks T024-T026 (/painel + impeccable shape feedback)
- Microcopy completo: `contracts/ui-contracts.md`
- Schema dos componentes: seção 9 acima
- i18n: namespace `auth.*` e `painel.*` em `src/messages/pt-BR.json`
