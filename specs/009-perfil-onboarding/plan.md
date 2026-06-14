# Plano Técnico: 009 — Perfil do Usuário + Onboarding WOW

**Feature Branch**: 009-perfil-onboarding (criar a partir de main após merge de 008)
**Data**: 2026-06-14

---

## Arquitetura

### Novas rotas

| Rota | Tipo | AppShell? | Propósito |
|------|------|-----------|-----------|
| `/[locale]/(app)/configuracoes/page.tsx` | Server Component | Sim | Central de Configurações |
| `/[locale]/bem-vindo/page.tsx` | Server Component | Não | Onboarding (tela cheia) |

### Novos componentes

```
src/components/features/perfil/
  AvatarUpload.tsx         ← Client Component: file input oculto + preview + upload action
  IdentityCard.tsx         ← Client Component: foto + nome + e-mail read-only; botão "Salvar"
  LinksCard.tsx            ← Client Component: LinkedIn + GitHub URLs; botão "Salvar"

src/components/features/onboarding/
  OnboardingShell.tsx      ← Client Component: container com step state (1-2) + transition
  WelcomeStep.tsx          ← Etapa 1: headline Fraunces + promessa + CTA "Vamos começar"
  CaptureLoopStep.tsx      ← Etapa 2: loop conversacional (ver wiring abaixo)
```

### Novas server actions

```typescript
// src/lib/actions/profile.ts
updateProfileAction(data: Partial<Pick<Profile, 'name' | 'linkedin_url' | 'github_url'>>)
  → Promise<{ error?: string }>

uploadAvatarAction(formData: FormData)
  → Promise<{ error?: string; url?: string }>
```

```typescript
// src/lib/actions/onboarding.ts
completeOnboardingAction()
  → Promise<void>  // UPDATE profiles SET onboarding_completed = true + revalidatePath
```

### Nova função de IA — `evaluateSufficiency`

```typescript
// src/lib/ai/mirror/evaluateSufficiency.ts

export type SufficiencyResult =
  | { sufficient: true }
  | { sufficient: false; follow_up_prompt: string }

export async function evaluateSufficiency(
  entries: { what_i_did: string; impact: string | null; tags: string[] }[]
): Promise<SufficiencyResult>
```

**Modelo**: Haiku (rápido, barato — não precisa do poder do Sonnet).

**O que avaliar** (prompt interno):
- Há pelo menos 1 entrada com `what_i_did` substancial (> 30 palavras) OU 2+ entradas com impacto ou métrica?
- As entradas revelam algum padrão ou especialidade detectável?
- Há contexto suficiente para afirmar algo sobre a pessoa com confiança?

**Se não suficiente**, gerar `follow_up_prompt` contextualizado: não um texto genérico
("me conta mais"), mas algo específico ao que já foi dito ("Você mencionou liderar uma
migração. Qual foi o resultado concreto? Um número ou mudança visível já basta.").

**Safety valve**: `CaptureLoopStep` conta rodadas no estado client-side. Após 3
follow-ups sem suficiência, força `{ sufficient: true }` e gera o espelho com o que tem.
Evita loop infinito e garante que o usuário sempre chega ao AHA.

**Schema Zod de saída**:
```typescript
const SufficiencySchema = z.discriminatedUnion('sufficient', [
  z.object({ sufficient: z.literal(true) }),
  z.object({ sufficient: z.literal(false), follow_up_prompt: z.string().min(1).max(300) }),
])
```

### Nova query

```typescript
// src/lib/db/profiles.ts
getProfile(supabase: SupabaseServerClient, userId: string): Promise<Profile | null>
```

### Novo tipo

```typescript
// src/types/profile.ts
export type Profile = {
  id: string
  name: string | null
  email: string
  avatar_url: string | null
  linkedin_url: string | null
  github_url: string | null
  current_title: string | null   // populado pelo chat (captura), não por form
  area: string | null            // populado pelo chat (captura), não por form
  onboarding_completed: boolean
  created_at: string
}
```

---

## Mudanças em arquivos existentes

### `src/app/[locale]/(app)/layout.tsx`

Hoje busca `profiles` com `select('name')`. Mudar para:
```typescript
supabase.from('profiles').select('name, onboarding_completed').eq('id', user.id).maybeSingle()
```
E adicionar após a resolução:
```typescript
if (!profile?.onboarding_completed) redirect('/bem-vindo')
```
O redirect acontece antes de renderizar qualquer coisa — sem flash de conteúdo.

### `src/components/layout/AppShellClient.tsx`

**Desktop sidebar footer** (linha ~97-114 do arquivo atual): adicionar link de engrenagem
abaixo do nome, acima do `LogoutButton`:
```tsx
<Link href="/configuracoes" aria-label="Configurações">
  <Settings size={16} />
</Link>
```

**Mobile top bar** (linha ~120-133): trocar o círculo de inicial por um `<Link href="/configuracoes">` com a mesma estética circular. No mobile, ao clicar no avatar vai para `/configuracoes`.

### `src/messages/pt-BR.json`

Adicionar namespaces `configuracoes` e `bemvindo`. Exemplos:

```json
"configuracoes": {
  "title": "Configurações",
  "identity": {
    "title": "Identidade",
    "name": "Nome",
    "email": "E-mail",
    "emailHint": "O e-mail não pode ser alterado aqui.",
    "photoLabel": "Foto de perfil",
    "photoChange": "Trocar foto",
    "photoError": {
      "size": "Foto muito grande (máx 5 MB).",
      "type": "Formato inválido. Use JPEG, PNG ou WebP."
    },
    "save": "Salvar",
    "saved": "Salvo!",
    "error": "Erro ao salvar. Tente de novo."
  },
  "links": {
    "title": "Links profissionais",
    "linkedin": "LinkedIn",
    "linkedinPlaceholder": "linkedin.com/in/seu-perfil",
    "github": "GitHub",
    "githubPlaceholder": "github.com/seu-usuario",
    "save": "Salvar",
    "saved": "Salvo!",
    "error": "Erro ao salvar. Tente de novo."
  }
},
"bemvindo": {
  "step1": {
    "headline": "Olá, {nome}.",
    "sub": "Aqui é onde o seu trabalho vira clareza.",
    "promise": "Você me conta o que fez. Eu revelo o que isso diz sobre quem você é.",
    "cta": "Vamos começar"
  },
  "step2": {
    "headline": "Me conta um pouco sobre você.",
    "sub": "Quanto mais eu sei, mais preciso fica o seu espelho.",
    "photo": "Adicionar foto",
    "name": "Nome",
    "linkedin": "LinkedIn (opcional)",
    "linkedinPlaceholder": "linkedin.com/in/seu-perfil",
    "cta": "Continuar"
  },
  "step3": {
    "headline": "Me conta a última coisa relevante que você fez no trabalho.",
    "placeholder": "Ex: liderei a migração de um sistema crítico, que reduziu os erros em 40%...",
    "cta": "Contar",
    "ctaLinkedin": "Importar PDF do LinkedIn",
    "reading": "Lendo o que você me contou...",
    "done": "É isso. Isso é o seu borogodó tomando forma.",
    "ctaPanel": "Ver meu painel"
  }
}
```

---

## Supabase Storage

### Configuração do bucket (manual, antes de T005)

1. No dashboard Supabase → Storage → New bucket
2. Nome: `avatars`, marcar como **Public bucket** (URLs públicas)
3. Policies a criar no SQL editor (ou via Storage UI):

```sql
-- Qualquer pessoa pode ver avatars (URL pública)
create policy "avatars public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Usuário só sobe para sua própria pasta
create policy "avatars own insert"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Usuário só atualiza sua própria pasta (para trocar foto)
create policy "avatars own update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
```

Path de upload: `{userId}/avatar` (sem extensão — upsert sobrescreve ao trocar foto).
`storage.foldername(name)[1]` retorna o primeiro segmento do path = userId.

### `uploadAvatarAction` (em `src/lib/actions/profile.ts`)

```typescript
export async function uploadAvatarAction(formData: FormData) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const file = formData.get('avatar') as File | null
  if (!file) return { error: 'Arquivo não encontrado' }
  if (file.size > 5 * 1024 * 1024) return { error: 'Foto muito grande (máx 5 MB).' }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    return { error: 'Formato inválido. Use JPEG, PNG ou WebP.' }

  const path = `${user.id}/avatar`
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (uploadError) return { error: 'Erro ao enviar foto.' }

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
  const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: cacheBustedUrl })
    .eq('id', user.id)
  if (profileError) return { error: 'Erro ao atualizar perfil.' }

  revalidatePath('/configuracoes')
  revalidatePath('/', 'layout')  // atualiza avatar no sidebar
  return { url: cacheBustedUrl }
}
```

A query string `?t=` é para cache-bust ao trocar a foto (o CDN pode cachear a URL anterior).

---

## Onboarding: wiring de `CaptureLoopStep`

`CaptureLoopStep` é o coração do onboarding. Gerencia um loop conversacional completo:

```typescript
type LoopState =
  | { phase: 'idle'; prompt: string }           // aguardando input do usuário
  | { phase: 'reading' }                         // POST /api/capture em andamento
  | { phase: 'reflecting'; reflection: string }  // mostra reflexo, avaliando suficiência
  | { phase: 'evaluating' }                      // POST /api/onboarding/evaluate em andamento
  | { phase: 'generating' }                      // POST /api/mirror/generate em andamento
  | { phase: 'revealed'; mirror: OnboardingMirror } // espelho inline revelado

// Estado imutável do loop
type LoopComponentState = {
  loopState: LoopState
  roundCount: number      // quantos follow-ups já houve (safety valve: máx 3)
  entries: string[]       // what_i_did de cada entrada capturada (para contexto visual)
}
```

**Fluxo detalhado:**

```
idle (prompt inicial ou follow_up_prompt)
  ↓ usuário submete texto ou PDF
reading (POST /api/capture)
  ↓ retorno do reflexo
reflecting (exibe reflection inline com animação stagger)
  ↓ automático após 1s de exibição
evaluating (POST /api/onboarding/evaluate — nova rota leve)
  ↓
  ├─ { sufficient: false, follow_up_prompt } + roundCount < 3
  │    → state = idle com novo prompt (follow_up_prompt)
  │
  ├─ { sufficient: false } + roundCount >= 3  ← safety valve
  │    → trata como sufficient: true
  │
  └─ { sufficient: true }
       → state = generating (POST /api/mirror/generate)
           ↓
         state = revealed (exibe headline + especialidades inline)
           ↓ usuário clica "Ver meu espelho completo"
         completeOnboardingAction() → router.push('/espelho')
```

**Nova rota leve de avaliação:**
```typescript
// src/app/api/onboarding/evaluate/route.ts
// POST com { userId } — busca as próprias entradas do usuário e chama evaluateSufficiency
// Retorna SufficiencyResult
// Usa RLS — só enxerga entradas do usuário autenticado
```

**Por que rota separada e não Server Action?**
`evaluateSufficiency` chama a API da Anthropic — é assíncrono e pode levar 2-4s. Uma
Server Action bloquearia o formulário. A rota permite fazer fetch async com estado
`evaluating` visível enquanto aguarda.

**Revelação inline do espelho (fase `revealed`):**
Não exibe o espelho completo — exibe apenas o "cartão de revelação":
- Headline da força principal (`mirror.primary_strength.headline`)
- Até 3 especialidades em chips (`mirror.strength_themes`)
- Fundo mel ou lilas-névoa, Fraunces para a headline
- CTA "Ver meu espelho completo →"

O espelho completo já foi salvo em `mirror_snapshots` pelo `/api/mirror/generate`. 
Ao redirecionar para `/espelho`, a página carrega normalmente.

---

## Validação Zod (updateProfileAction)

```typescript
const ProfileUpdateSchema = z.object({
  name:         z.string().min(1).max(100).optional(),
  linkedin_url: z.string().url().nullish(),
  github_url:   z.string().url().nullish(),
})
```

LinkedIn e GitHub: aceitar string vazia como `null` (campo limpo):
```typescript
linkedin_url: z.preprocess(
  (v) => (v === '' ? null : v),
  z.string().url().nullable().optional()
)
```

---

## Convenções a seguir (da constituição)

- Server Components por padrão; Client só onde há interatividade (upload, form state)
- Todas as strings via `next-intl` — zero hardcode
- TDD: testes antes da implementação; cobertura ≥ 80%
- `/code-review low` ao fim das Phases 2 e 3; `/code-review high` na Phase 4
- `/impeccable audit` antes do PR
- `/pr-review` multi-agente antes de abrir o PR
