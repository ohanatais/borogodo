# Quickstart / Validação: Termos, Privacidade e Consentimento

Roteiro de validação manual ponta-a-ponta. Cobre os cenários de aceitação das 4 user stories.

## Pré-requisitos

- Migration `015_profiles_consent.sql` aplicada no ambiente de dev.
- `npm run dev` rodando.
- Ter à mão: uma conta Google de teste e um e-mail para cadastro por senha.
- Para testar re-consentimento de conta existente: uma conta que já existia antes da feature (ou zerar
  `terms_version` de uma conta de teste via SQL: `update profiles set terms_version = null where id = '...'`).

## Cenário 1 — Páginas legais públicas e vínculos (US1)

1. Sem estar logada, acesse `http://localhost:3000/politica-de-privacidade` e `/termos-de-uso`.
   - **Esperado**: as páginas carregam sem exigir login, com o layout do produto e a versão vigente
     visível. Sem prefixo de locale na URL.
2. Abra a landing page e role até o rodapé.
   - **Esperado**: links "Termos de Uso" e "Política de Privacidade" levam às páginas.
3. Logada, vá em `/configuracoes`.
   - **Esperado**: seção com os mesmos links.
4. `curl -s http://localhost:3000/politica-de-privacidade | grep -i "<h1"` (ou ver fonte).
   - **Esperado**: conteúdo presente no HTML servido (SSR/indexável).

## Cenário 2 — Aceite auditável no cadastro (US2)

1. Na tela de cadastro, observe o aviso sign-in-wrap.
   - **Esperado**: "Ao continuar, você concorda com os Termos de Uso e a Política de Privacidade" com
     links funcionais, junto aos dois métodos, **sem** checkbox de termos.
2. Cadastre-se por **e-mail/senha**, confirme o e-mail, conclua o onboarding.
   - **Esperado (SQL)**: `select terms_accepted_at, terms_version from profiles where email = '...'` retorna
     data/hora preenchidas e a versão vigente.
3. Cadastre-se por **Google** (outra conta), conclua o onboarding.
   - **Esperado (SQL)**: mesmo resultado — data/hora + versão gravadas.
4. Faça logout e login de novo com uma das contas.
   - **Esperado**: `terms_accepted_at` **não** muda (não sobrescreve); nenhuma tela de aceite reaparece.

## Cenário 3 — Gate de re-consentimento (US3)

1. Zere o aceite de uma conta logada: `update profiles set terms_version = null where id = '...'`.
2. Recarregue qualquer página interna (ex.: `/painel`).
   - **Esperado**: redirecionamento para `/consentimento` antes de acessar o produto.
3. Na tela `/consentimento`, clique "Aceito".
   - **Esperado**: grava a versão vigente + data/hora; redireciona de volta ao produto; não pede de novo.
4. Simule bump de versão: altere `CURRENT_TERMS_VERSION` em `policy.ts` para um valor novo, recarregue.
   - **Esperado**: a conta (agora com versão anterior) volta a passar pelo `/consentimento`.
5. Conta já em dia (versão vigente): navegue normalmente.
   - **Esperado**: nenhuma tela de aceite.

## Cenário 4 — Consentimento de marketing (US4)

1. No cadastro por **e-mail/senha**: observe o checkbox de marketing.
   - **Esperado**: desmarcado por padrão, separado do aviso de termos.
2. Cadastre-se por **Google** e vá ao onboarding.
   - **Esperado**: nenhuma pergunta de marketing no onboarding (decisão travada em
     `design-brief.md` §10 — onboarding livre de consentimento de marketing; o caminho Google só
     liga marketing depois, em `/configuracoes`).
3. Conclua o onboarding.
   - **Esperado (SQL)**: `marketing_consent = false` (padrão, sem UI no onboarding para alterar).
4. Em `/configuracoes`, ligue o toggle de marketing e salve; recarregue.
   - **Esperado**: `marketing_consent = true` persistido.
5. Desligue e salve.
   - **Esperado**: `marketing_consent = false`.

## Verificação de qualidade

- `npm run test` — testes unit/integração passam; cobertura ≥ 80% nos módulos novos.
- `npm run lint` e `npm run build` — sem erros de tipo (strict, sem `any`).
- Revisão em viewport 375 px (mobile-first) das telas novas/alteradas; toques ≥ 48×48 px.
- `/impeccable audit` roda antes do PR.
