# Tasks: 009 — Perfil do Usuário + Onboarding WOW

**Feature Branch**: 009-perfil-onboarding
**Criado**: 2026-06-14
**Spec**: [spec.md](./spec.md) | **Plano técnico**: [plan.md](./plan.md) | **Data model**: [data-model.md](./data-model.md)

> Abrir em chat novo. Primeira coisa: dar push/merge do branch 008 na main.
> Ler plan.md completo antes de começar — contém assinaturas, SQL e wiring detalhado.

---

## Phase 0 — Merge 008 + Setup

### T001 — Commit pendentes do branch 008

- [ ] `git status` no branch `008-historico-nav`
- [ ] Verificar o que mudou em `package.json` e `package-lock.json`
- [ ] Se forem dependências legítimas: commitar com `chore: atualiza dependências`
- [ ] Se forem artefatos de teste: descartar com `git checkout -- package.json package-lock.json`
- [ ] Push para origin: `git push origin 008-historico-nav`

### T002 — Mergear 008 na main

- [ ] Verificar se há PR aberto para 008; se não houver, criar: `gh pr create`
- [ ] Rodar `/pr-review` se ainda não foi feito neste branch
- [ ] Mergear o PR via GitHub (ou `gh pr merge --merge`)
- [ ] `git checkout main && git pull`

### T003 — Criar branch 009

- [ ] `git checkout -b 009-perfil-onboarding`

### T004 — Criar bucket Supabase Storage (manual)

- [ ] Dashboard Supabase → Storage → New bucket → nome `avatars`, Public: **sim**
- [ ] Aplicar policies do bucket (ver `data-model.md` → seção "Policies do Storage")
  - Pode ser via SQL editor do Supabase dashboard, ou via Supabase MCP `apply_migration`
- [ ] Confirmar que o bucket aparece na lista de Storage

---

## Phase 1 — Fundação (DB + Tipos + Actions)

### T005 — Migration de profiles

- [ ] Criar `supabase/migrations/005_profiles_links.sql`:
  ```sql
  alter table public.profiles
    add column if not exists linkedin_url   text,
    add column if not exists github_url     text,
    add column if not exists current_title  text,
    add column if not exists area           text;
  ```
- [ ] Aplicar via Supabase MCP `apply_migration` ou `supabase db push`
- [ ] Confirmar que colunas aparecem na tabela profiles

### T006 — Tipo `Profile`

- [ ] Criar `src/types/profile.ts` com `Profile` type e `ProfileArea` type
- [ ] Ver schema completo em `data-model.md` → seção "Tipo TypeScript"

### T007 — Query `getProfile`

- [ ] Criar `src/lib/db/profiles.ts`:
  ```typescript
  import type { createServerClient } from '@/lib/db/supabase/server'
  import type { Profile } from '@/types/profile'

  type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>

  export async function getProfile(
    supabase: SupabaseServerClient,
    userId: string
  ): Promise<Profile | null> {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    return data as Profile | null
  }
  ```

### T008 — Server actions de perfil

- [ ] Criar `src/lib/actions/profile.ts` com:
  - `updateProfileAction(data)` — Zod validation + UPDATE profiles
  - `uploadAvatarAction(formData)` — validação + upload Storage + UPDATE profiles
- [ ] Ver assinaturas e código de referência em `plan.md` → seção "uploadAvatarAction"
- [ ] Schema Zod: ver `plan.md` → seção "Validação Zod"
- [ ] Ambas chamam `revalidatePath('/configuracoes')` após sucesso
- [ ] `uploadAvatarAction` também chama `revalidatePath('/', 'layout')` para atualizar avatar no sidebar

### T009 — Server action de onboarding

- [ ] Criar `src/lib/actions/onboarding.ts`:
  ```typescript
  'use server'
  import { createServerClient } from '@/lib/db/supabase/server'
  import { redirect } from 'next/navigation'

  export async function completeOnboardingAction() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', user.id)
  }
  ```

### T010 — Testes das actions e queries

- [ ] `src/lib/db/__tests__/profiles.test.ts` — mock do supabase client, testa retorno nulo e completo
- [ ] `src/lib/actions/__tests__/profile.test.ts` — testa validação Zod, caminho de erro, sucesso
- [ ] `src/lib/actions/__tests__/onboarding.test.ts` — testa update e redirect
- [ ] Cobertura ≥ 80% nas funções novas

---

## Phase 2 — Central de Configurações (`/configuracoes`)

### T011 — Página `/configuracoes`

- [ ] Criar `src/app/[locale]/(app)/configuracoes/page.tsx`:
  ```typescript
  import { redirect } from 'next/navigation'
  import { getTranslations } from 'next-intl/server'
  import { createServerClient } from '@/lib/db/supabase/server'
  import { getProfile } from '@/lib/db/profiles'
  import { IdentityCard } from '@/components/features/perfil/IdentityCard'
  import { LinksCard } from '@/components/features/perfil/LinksCard'

  export default async function ConfiguracoesPage() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const [profile, t] = await Promise.all([
      getProfile(supabase, user.id),
      getTranslations('configuracoes'),
    ])

    return (
      <div className="max-w-[640px] mx-auto px-6 py-8 space-y-6">
        <h1 className="text-2xl font-semibold" style={{ fontFamily: 'Fraunces, serif' }}>
          {t('title')}
        </h1>
        <IdentityCard profile={profile} />
        <LinksCard profile={profile} />
      </div>
    )
  }
  ```

### T012 — `AvatarUpload.tsx`

- [ ] Criar `src/components/features/perfil/AvatarUpload.tsx` (Client Component)
- [ ] Props: `currentUrl: string | null`, `onUpload: (url: string) => void`
- [ ] Input file oculto (`accept="image/jpeg,image/png,image/webp"`, max 5 MB validado client-side)
- [ ] Preview circular 80px (img com `object-fit: cover`, border-radius 50%)
- [ ] Ao selecionar arquivo: criar FormData, chamar `uploadAvatarAction`, receber `url`
- [ ] Estado: `idle | uploading | error`; feedback inline de erro
- [ ] Se `currentUrl` null: exibe ícone de câmera com fundo creme + borda tracejada

### T013 — `IdentityCard.tsx`

- [ ] Criar `src/components/features/perfil/IdentityCard.tsx` (Client Component)
- [ ] Props: `profile: Profile | null`
- [ ] Campos: `AvatarUpload` + nome (input text) + e-mail (read-only, estilo opaco)
- [ ] Estado local para `name` (pre-populated from `profile.name`)
- [ ] Botão "Salvar" → `updateProfileAction({ name })` → feedback inline "Salvo!" / erro
- [ ] Card com estilo `var(--card)` + `var(--border)` + border-radius 12px + padding 24px

### T014 — `LinksCard.tsx`

- [ ] Criar `src/components/features/perfil/LinksCard.tsx` (Client Component)
- [ ] Props: `profile: Profile | null`
- [ ] Campos: LinkedIn URL + GitHub URL (ambos opcionais, type="url")
- [ ] Prefixo visual nas labels (ícone Lucide `Linkedin` e `Github`)
- [ ] Botão "Salvar" → `updateProfileAction({ linkedin_url, github_url })` → feedback inline
- [ ] Validação client-side: se preenchido, deve ser URL válida

### T015 — Link de engrenagem no AppShell

- [ ] Em `AppShellClient.tsx`, importar `Settings` de `lucide-react`
- [ ] **Desktop sidebar footer**: adicionar `<Link href="/configuracoes">` com `<Settings size={16} />` dentro do bloco de conta (antes do nome do usuário ou inline como ícone à direita do nome)
- [ ] **Mobile top bar**: substituir o `div` circular de inicial por `<Link href="/configuracoes">` mantendo a mesma aparência circular com a inicial + adicionar `aria-label="Configurações"`

### T016 — i18n strings de configuracoes

- [ ] Adicionar namespace `configuracoes` em `src/messages/pt-BR.json`
- [ ] Ver strings completas em `plan.md` → seção "Mudanças em arquivos existentes → pt-BR.json"
- [ ] Adicionar stub em `src/messages/en.json` (mesmas chaves, valores em inglês ou igual PT enquanto não traduzido)

### T017 — Testes dos componentes de perfil

- [ ] `src/components/features/perfil/__tests__/AvatarUpload.test.tsx`
- [ ] `src/components/features/perfil/__tests__/IdentityCard.test.tsx`
- [ ] `src/components/features/perfil/__tests__/LinksCard.test.tsx`
- [ ] Cobertura ≥ 80%

### T018 — `/code-review low` na Phase 2

- [ ] Rodar `/code-review low` nos arquivos criados nesta fase

---

## Phase 3 — Onboarding (`/bem-vindo`)

### T019 — Redirect de onboarding no layout

- [ ] Em `src/app/[locale]/(app)/layout.tsx`, alterar:
  - Query de profiles: `select('name, onboarding_completed')` (adicionar `onboarding_completed`)
  - Após resolver, antes de renderizar: `if (!profile?.onboarding_completed) redirect('/bem-vindo')`
- [ ] Garantir que o redirect não roda em loop (verificar que `/bem-vindo` está FORA do grupo `(app)`)

### T020 — Página `/bem-vindo`

- [ ] Criar `src/app/[locale]/bem-vindo/page.tsx` (Server Component, FORA do grupo (app)):
  ```typescript
  export default async function BemVindoPage() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const profile = await getProfile(supabase, user.id)
    if (profile?.onboarding_completed) redirect('/espelho')

    return <OnboardingShell userName={profile?.name ?? ''} />
  }
  ```

### T021 — `OnboardingShell.tsx`

- [ ] Criar `src/components/features/onboarding/OnboardingShell.tsx` (Client Component)
- [ ] Props: `userName: string`
- [ ] Estado: `step: 1 | 2` (sem etapa de perfil)
- [ ] Renderiza `WelcomeStep` (step 1) e `CaptureLoopStep` (step 2)
- [ ] Transição: Framer Motion `AnimatePresence` com fade/slide sutil
- [ ] Layout: tela cheia, fundo `var(--color-roxo-jambo)` na etapa 1, `var(--color-creme)` na etapa 2
- [ ] Logo centrado no topo (sem sidebar, sem nav)

### T022 — `WelcomeStep.tsx`

- [ ] Criar `src/components/features/onboarding/WelcomeStep.tsx`
- [ ] Props: `userName: string`, `onNext: () => void`
- [ ] Headline Fraunces + promessa em 2 linhas; CTA "Vamos começar" → `onNext()`
- [ ] Fundo roxo-jambo, texto claro

### T023 — Rota `/api/onboarding/evaluate`

- [ ] Criar `src/app/api/onboarding/evaluate/route.ts` (POST)
- [ ] Auth: `supabase.auth.getUser()` — 401 se não autenticado
- [ ] Busca entradas recentes do usuário: `supabase.from('entries').select('what_i_did, impact, tags').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)`
- [ ] Chama `evaluateSufficiency(entries)` e retorna o resultado como JSON
- [ ] Sem body na request (usa RLS — o usuário autenticado só vê suas próprias entradas)

### T024 — `evaluateSufficiency` (função de IA)

- [ ] Criar `src/lib/ai/mirror/evaluateSufficiency.ts`
- [ ] Usa Haiku (`models.extraction` — mesmo nível do pipeline de captura, não do espelho)
- [ ] Schema Zod de output (ver `plan.md` → seção "Nova função de IA"):
  ```typescript
  const SufficiencySchema = z.discriminatedUnion('sufficient', [
    z.object({ sufficient: z.literal(true) }),
    z.object({ sufficient: z.literal(false), follow_up_prompt: z.string().min(1).max(300) }),
  ])
  ```
- [ ] Prompt interno avalia: substância (> 30 palavras ou impacto numérico), padrão
  detectável, contexto suficiente para 1+ afirmação confiante sobre a pessoa
- [ ] Se não suficiente: `follow_up_prompt` específico ao que foi dito — nunca genérico

### T025 — `CaptureLoopStep.tsx`

- [ ] Criar `src/components/features/onboarding/CaptureLoopStep.tsx` (Client Component)
- [ ] Props: nenhuma (acessa API diretamente via fetch)
- [ ] Estado: ver tipos em `plan.md` → seção "wiring de CaptureLoopStep"
  - `{ phase: 'idle', prompt }` | `reading` | `{ phase: 'reflecting', reflection }` |
    `evaluating` | `generating` | `{ phase: 'revealed', mirror }`
  - `roundCount: number` (safety valve — máx 3 follow-ups, depois força suficiente)
- [ ] **idle**: textarea + botão "Contar" + botão secundário "Importar PDF do LinkedIn"
  - Placeholder/prompt muda a cada rodada (usa `loopState.prompt`)
- [ ] **reading**: animação stagger Framer Motion ("✓ Lendo o que você me contou…" etc.)
  - POST `/api/capture` com `{ text, mode: 'text' }` ou FormData `mode: 'file'`
- [ ] **reflecting**: exibe `reflection.headline` + skills/tags detectadas; após 1.5s → `evaluating`
- [ ] **evaluating**: indicador de carregamento sutil ("Avaliando o que aprendi…")
  - POST `/api/onboarding/evaluate` (sem body)
  - Se `{ sufficient: false }` e `roundCount < 3`: volta para `idle` com `follow_up_prompt`
  - Se safety valve (`roundCount >= 3`) ou `{ sufficient: true }`: → `generating`
- [ ] **generating**: "Criando seu espelho…" — POST `/api/mirror/generate`
- [ ] **revealed**: cartão de revelação inline
  - Headline do espelho (`mirror.primary_strength.headline`) em Fraunces
  - Até 3 especialidades em chips (`mirror.strength_themes`)
  - CTA "Ver meu espelho completo →" → `completeOnboardingAction()` → `router.push('/espelho')`
- [ ] Erros em qualquer fase: exibir mensagem + botão retry; nunca quebrar silenciosamente

### T026 — i18n strings de bemvindo

- [ ] Adicionar namespace `bemvindo` em `src/messages/pt-BR.json`
- [ ] Incluir variantes para cada fase do loop (idle_initial, idle_followup, reading,
  reflecting, evaluating, generating, revealed, cta_final)
- [ ] Stub em `en.json`

### T027 — Testes do onboarding

- [ ] `src/components/features/onboarding/__tests__/OnboardingShell.test.tsx`
- [ ] `src/components/features/onboarding/__tests__/WelcomeStep.test.tsx`
- [ ] `src/components/features/onboarding/__tests__/CaptureLoopStep.test.tsx`
  — mock de `/api/capture`, `/api/onboarding/evaluate`, `/api/mirror/generate`
  — testa transição de fases, safety valve, erro + retry
- [ ] `src/app/api/onboarding/__tests__/evaluate.test.ts` — auth, query, resultado
- [ ] `src/lib/ai/mirror/__tests__/evaluateSufficiency.test.ts` — mock do LLM
- [ ] `src/app/[locale]/bem-vindo/__tests__/page.test.tsx`
- [ ] Cobertura ≥ 80%

### T028 — `/code-review low` na Phase 3

- [ ] Rodar `/code-review low` nos arquivos criados nesta fase

---

## Phase 4 — Audit + Review

### T029 — `/impeccable audit`

- [ ] Rodar `/impeccable audit` na página `/configuracoes` (design, acessibilidade, mobile)
- [ ] Rodar `/impeccable audit` na tela `/bem-vindo` (WelcomeStep + cada fase do CaptureLoopStep)
- [ ] Endereçar findings relevantes

### T030 — `/code-review high`

- [ ] Rodar `/code-review high` em toda a feature antes do PR

### T031 — `/pr-review` + abertura do PR

- [ ] `git push origin 009-perfil-onboarding`
- [ ] Criar PR: `gh pr create`
- [ ] Rodar `/pr-review` (6 subagentes: segurança, qualidade, arquitetura, performance, requisitos, regressão)
- [ ] Endereçar findings CRITICAL e HIGH antes de mergear

---

## Checklist de validação manual

Antes de fechar o PR, verificar manualmente:

**Onboarding:**
- [ ] Novo usuário → cai em `/bem-vindo` (não no `/painel`)
- [ ] WelcomeStep: nome exibido corretamente; CTA leva para CaptureLoopStep
- [ ] CaptureLoopStep: input de texto → "Lendo…" → reflexo → "Avaliando…" → follow-up ou espelho
- [ ] Follow-up prompt é específico ao que foi dito (não genérico)
- [ ] Safety valve: após 3 follow-ups sem suficiência, o espelho é gerado de qualquer forma
- [ ] Caminho PDF do LinkedIn: upload → reading → reflecting → evaluate → reveal
- [ ] Revelação do espelho: headline + chips de especialidades aparecem inline
- [ ] "Ver meu espelho completo" → `/espelho` com o espelho já gerado
- [ ] Usuário existente (`onboarding_completed = true`) → vai direto para `/espelho`

**Configurações:**
- [ ] Em `/configuracoes`: troca de foto → avatar atualizado no sidebar sem reload completo
- [ ] Em `/configuracoes`: LinkedIn salvo → exibido no campo ao recarregar
- [ ] Link de engrenagem no sidebar desktop leva para `/configuracoes`
- [ ] Mobile: tocar no avatar no top bar leva para `/configuracoes`
- [ ] Mobile (375px): formulário utilizável, campos têm toque ≥ 48px
