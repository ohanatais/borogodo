# Research: Termos, Privacidade e Consentimento

Decisões de arquitetura e o raciocínio por trás delas. Cada item resolve uma escolha não-óbvia levantada
no plano.

## R1 — Base legal do aceite: sign-in-wrap, não checkbox

**Decisão**: O aceite dos Termos usa o padrão *sign-in-wrap* — um aviso "Ao continuar, você concorda com
os Termos de Uso e a Política de Privacidade" com links, exibido junto aos botões de cadastro, **sem
checkbox obrigatório**. O que confere validade não é a caixa marcada, e sim o **registro server-side** do
aceite.

**Rationale**: Aceite de Termos de Uso é um contrato; a base legal da LGPD é "execução de contrato"
(Art. 7, V), que não exige consentimento por checkbox — o ato afirmativo de se cadastrar, com os termos
visíveis e vinculados no ponto da ação, forma o aceite. É o padrão dominante de mercado (Google, Notion,
Linear, Vercel) e o de menor atrito. Também **elimina o problema do OAuth**: sem checkbox, não há estado
de UI para se perder no redirect do Google.

**Alternativas rejeitadas**: *Clickwrap* (checkbox obrigatório travando os botões) — mais forte
juridicamente, porém mais atrito e exige gambiarra para preservar o estado do checkbox através do redirect
do Google. Decidido com a Ohana: reservar checkbox explícito **só** para marketing, onde a LGPD realmente
o exige.

## R2 — Onde o aceite é registrado: camada de render autenticado (onboarding + gate), não no callback

**Decisão**: O carimbo do aceite (`terms_accepted_at`, `terms_version`) acontece em dois pontos, ambos na
camada de render autenticado do App Router:
1. **Novos usuários**: carimbados silenciosamente ao concluir o onboarding (server action
   `recordTermsAcceptance` dentro do fluxo que completa o onboarding). Eles já consentiram via aviso
   sign-in-wrap no cadastro; o carimbo é o registro auditável, sem clique extra.
2. **Usuários existentes e bumps de versão**: capturados pelo gate em `(app)/layout.tsx`, redirecionados a
   uma tela explícita `/consentimento` que registra o aceite.

**Rationale**:
- **Uniformidade Google vs e-mail**: ambos passam pelo onboarding na primeira vez; carimbar ali trata os
  dois métodos identicamente. A rota `/auth/callback/route.ts` fica **fora** do grupo `[locale]` e só é
  atingida por OAuth e pelo link de confirmação de e-mail — não por logins subsequentes — então carimbar
  lá seria parcial e duplicaria lógica.
- **Testabilidade**: server actions e o gate são triviais de testar com Vitest; a rota de callback mistura
  troca de código OAuth com escrita de cookie e é mais frágil.
- **Preserva o sign-in-wrap**: novos usuários não veem tela de aceite (o carimbo é silencioso); só quem
  nunca viu o aviso da versão vigente (contas antigas / nova versão) vê a tela explícita.

**Ordem dos gates em `(app)/layout.tsx`** (guarda a promessa acima):
1. `!user` → `/login`
2. `!onboarding_completed` → `/bem-vindo` (onboarding carimba o aceite ao concluir)
3. `terms_version !== CURRENT_TERMS_VERSION` → `/consentimento`

Um usuário novo é resolvido no passo 2 (carimbado), então passa no passo 3. Um usuário existente passa no
passo 2 (já fez onboarding) e é pego no passo 3. Um bump de versão pega todos no passo 3.

**Alternativas rejeitadas**:
- *Carimbar no callback OAuth* — parcial (não cobre todos os caminhos) e frágil.
- *Trigger de banco* (`handle_new_user`) carimbando no insert — acopla a versão vigente (que vive no
  código, em `policy.ts`) ao banco; e o trigger de criação de perfil não está sob controle das migrations
  deste repo. Rejeitado por acoplamento e por fugir do controle de versão do código.
- *Gate único para todos* (inclusive novos) — reintroduziria atrito de clique logo após o cadastro,
  contradizendo a escolha do sign-in-wrap.

## R3 — Versionamento e re-consentimento

**Decisão**: `src/lib/legal/policy.ts` exporta `CURRENT_TERMS_VERSION` (string, ex.: `"2026-07"`). O aceite
grava a versão vigente. O gate compara `profile.terms_version` com `CURRENT_TERMS_VERSION`; se diferente
(inclusive `null`), exige re-aceite. Guardamos apenas a **versão vigente aceita** por conta — não um
histórico completo de versões (fora de escopo).

**Rationale**: Uma única string versão como fonte de verdade no código torna o "bump" trivial (troca a
constante → todos re-aceitam no próximo acesso) e mantém o mecanismo simples e testável. Espelha o padrão
já usado em `lib/support/channels.ts` (constantes centralizadas como fonte única).

**Alternativas rejeitadas**: Tabela de histórico de aceites (audit trail multi-versão) — mais robusta para
disputas, porém overkill pré-launch e explicitamente fora de escopo na spec. Pode virar feature futura.

## R4 — Captura do consentimento de marketing (desligado por padrão)

**Decisão**: `marketing_consent boolean not null default false`. Captura:
- **E-mail/senha**: checkbox desmarcado no `AuthForm`; o valor viaja em `options.data` no
  `supabase.auth.signUp()` (vai para `user_metadata`) e é **persistido silenciosamente** em `profiles`
  quando a conta conclui o onboarding (sem UI de marketing no onboarding).
- **Google**: nenhuma pergunta de marketing no fluxo (nem cadastro, nem onboarding) → permanece `false`.
- **Ambos**: editável a qualquer momento via toggle em `/configuracoes`.

**Rationale**: A LGPD trata comunicação de marketing como consentimento explícito, livre e revogável —
jamais pré-marcado (opt-out) nem empacotado com o aceite dos termos. Default `false` no banco garante que
nenhuma conta nasce opada-in. Decisão da Ohana: **manter o onboarding livre de consentimento de marketing**
para preservar o momento WOW/AHA — o único ponto de captura no cadastro é o checkbox do formulário de
e-mail; o caminho Google só liga marketing nas configurações. O onboarding ainda pode gravar o valor do
metadata do e-mail **sem exibir UI** (persistência silenciosa), ou a persistência pode acontecer no mesmo
ponto do carimbo de aceite — detalhe de implementação, sem UI de marketing no fluxo.

**Alternativas rejeitadas**: *Default `true` para Google* (ideia inicial) — viola a LGPD (consentimento
pré-ativado). *Pergunta de marketing no onboarding do Google* — capturaria mais opt-ins, mas a Ohana optou
por não colocar consentimento de marketing no onboarding para não esfriar o encantamento.

## R5 — Páginas legais: SSR, URLs dedicadas, conteúdo editável separado

**Decisão**: Páginas em `src/app/[locale]/termos-de-uso/page.tsx` e
`src/app/[locale]/politica-de-privacidade/page.tsx`, Server Components (SSR, indexáveis), públicas (fora do
grupo `(app)`, sem exigir login). O texto vem de módulos editáveis em `src/content/legal/*.ts` (estrutura
de seções tipada), com **placeholder** agora. Um componente `LegalPage` compartilha o layout (título,
versão vigente, data, rodapé) entre as duas.

**Rationale**: `localePrefix: 'never'` no `routing.ts` significa que as rotas não recebem prefixo de
locale → `borogodo.ai/politica-de-privacidade` resolve direto (requisito de URL legível da Ohana).
Separar conteúdo (em `content/legal`) do layout permite que uma pessoa não técnica troque o texto real
depois sem tocar em componentes (SC-006). SSR atende SEO/GEO e crawlers de IA.

**Alternativas rejeitadas**: MDX — poderoso, mas adiciona dependência/toolchain; um módulo TS tipado de
seções é suficiente para texto jurídico e mais simples de i18n-izar. Página client-side — perderia
indexação e SSR.

## R6 — Fonte única de verdade (`policy.ts`)

**Decisão**: `src/lib/legal/policy.ts` centraliza `CURRENT_TERMS_VERSION` e as rotas
(`LEGAL_ROUTES.terms`, `LEGAL_ROUTES.privacy`), consumidas por: aviso do AuthForm, Footer, configurações,
gate, tela de consentimento e as próprias páginas. Espelha `lib/support/channels.ts`.

**Rationale**: Evita divergência de versão/URL entre as ~6 superfícies que referenciam os documentos. Uma
mudança de versão ou de slug acontece em um lugar só.

## Resumo das decisões

| # | Decisão | Efeito |
|---|---|---|
| R1 | Sign-in-wrap (sem checkbox) para termos | Menor atrito; resolve OAuth; conforme LGPD (contrato) |
| R2 | Registro no onboarding (novos) + gate (existentes/bump) | Uniforme, testável, sem duplicar no callback |
| R3 | Versão única em `policy.ts` + gate compara | Re-consentimento trivial; sem histórico multi-versão |
| R4 | Marketing `default false`, opt-in explícito | Conforme LGPD; nenhuma conta nasce opada-in |
| R5 | Páginas SSR em URLs dedicadas + conteúdo editável | SEO/GEO; texto trocável sem mexer no código |
| R6 | `policy.ts` como fonte única | Zero divergência entre superfícies |
