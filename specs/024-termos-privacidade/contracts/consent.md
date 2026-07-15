# Contracts: Consentimento

Esta feature não expõe API pública nova. Os "contratos" são: as **rotas**, as **server actions** e o
**comportamento do gate**. Todos internos ao App Router.

## Rotas

| Rota | Auth? | Render | Descrição |
|---|---|---|---|
| `/termos-de-uso` | não | SSR (Server Component) | Página pública dos Termos de Uso. Mostra versão vigente. |
| `/politica-de-privacidade` | não | SSR (Server Component) | Página pública da Política de Privacidade. |
| `/consentimento` | sim | Server Component + form action | Tela de re-consentimento (contas sem aceite da versão vigente). Fora do grupo `(app)` para não recursar no gate. |

Fonte das rotas: `LEGAL_ROUTES` em `src/lib/legal/policy.ts` (não hardcodar strings de rota nas
superfícies).

## `src/lib/legal/policy.ts` (fonte única)

```typescript
export const CURRENT_TERMS_VERSION = '2026-07' // string; bump aqui dispara re-consentimento

export const LEGAL_ROUTES = {
  terms: '/termos-de-uso',
  privacy: '/politica-de-privacidade',
} as const

/** Uma conta precisa (re)aceitar se nunca aceitou ou aceitou versão anterior. */
export function needsTermsAcceptance(termsVersion: string | null): boolean {
  return termsVersion !== CURRENT_TERMS_VERSION
}
```

## Server actions — `src/lib/actions/consent.ts`

Todas: (1) verificam `auth.getUser()` antes de qualquer lógica; (2) escrevem apenas a linha do próprio
usuário; (3) tratam erro explicitamente; (4) revalidam o que for necessário.

### `recordTermsAcceptance()`
- **Quando**: ao concluir o onboarding (novos usuários) e ao submeter a tela `/consentimento`
  (existentes/bump).
- **Efeito**: grava `terms_accepted_at = now()` e `terms_version = CURRENT_TERMS_VERSION` na linha do
  usuário.
- **Idempotência**: se já estiver na versão vigente, é no-op (não sobrescreve `terms_accepted_at` para não
  perder a data original do aceite vigente).
- **Retorno**: `{ success: true } | { success: false, error: string }`.

### `setMarketingConsent(optIn: boolean)`
- **Quando**: conclusão do onboarding (persistindo a escolha do checkbox de e-mail ou da pergunta do
  Google) e toggle em `/configuracoes`.
- **Input**: `boolean` validado (Zod boundary).
- **Efeito**: grava `marketing_consent = optIn` na linha do usuário.
- **Retorno**: `{ success: true } | { success: false, error: string }`.

> Nota: no cadastro por e-mail/senha, o valor inicial do opt-in viaja em `options.data.marketing_consent`
> no `supabase.auth.signUp()` (metadata), e é persistido em `profiles` na conclusão do onboarding via
> `setMarketingConsent`. Não é gravado no banco antes disso.

## Comportamento do gate — `src/app/[locale]/(app)/layout.tsx`

Ordem de verificação (curto-circuito, cada uma um `redirect`):

1. `!user` → `redirect('/login')`
2. `!profile.onboarding_completed` → `redirect('/bem-vindo')`
3. `needsTermsAcceptance(profile.terms_version)` → `redirect('/consentimento')`

Contrato: um usuário só alcança o conteúdo de `(app)` quando autenticado **e** com onboarding concluído
**e** com aceite da versão vigente. Novos usuários satisfazem (3) porque o onboarding grava o aceite antes
de marcar `onboarding_completed`.

## Superfícies de exibição (contrato de UI)

| Superfície | Conteúdo | Fonte |
|---|---|---|
| `AuthForm` (modo signup) | Aviso "Ao continuar, você concorda com [Termos] e [Política]"; checkbox de marketing desmarcado **só** no modo e-mail/senha | i18n `legal.*` + `LEGAL_ROUTES` |
| Onboarding | Grava o aceite ao concluir; persiste silenciosamente o marketing do metadata do e-mail. **Sem UI de marketing** (decisão: onboarding livre de consentimento de marketing) | server actions |
| `Footer` | Links para as duas páginas | `LEGAL_ROUTES` |
| `/configuracoes` | Toggle de marketing + "Você aceitou os termos (vX) em DD/MM/AAAA" + links | perfil + `policy.ts` |
| `/consentimento` | Resumo + links + botão "Aceito" | server action `recordTermsAcceptance` |

## Contrato i18n

Namespace `legal` em `src/messages/pt-BR.json` (autoritativo) e `en.json` (stub/fallback). Chaves mínimas:
`signInWrap` (com placeholders de link), `marketingOptIn`, `consentGate.*`, `settings.*`,
`termsPage.*`, `privacyPage.*`. Nenhuma string hardcoded em componente.
