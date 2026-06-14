# Spec: 009 — Perfil do Usuário + Onboarding WOW

**Feature**: 009-perfil-onboarding
**Branch**: 009-perfil-onboarding (criar a partir de main após merge de 008)
**Depende de**: todas as features anteriores (002–008) mergeadas

---

## O quê e por quê

Dois buracos abertos no produto:

**1. Perfil sem gestão.** A tabela `profiles` só tem `name/email/avatar_url`. Não existe tela
pra atualizar foto, cargo atual, área, LinkedIn ou GitHub. Esses dados enriquecem o contexto
do espelho e da geração de conteúdo (que vem depois).

**2. Onboarding ausente.** Ao se cadastrar, o usuário cai direto no `/painel` vazio. O campo
`profiles.onboarding_completed` existe desde a feature 002 mas nunca é setado — nunca houve
fluxo. O WOW moment (ver a IA estruturar seu trabalho) e o AHA moment (ver o espelho gerado
a partir do que você contou) nunca acontecem de forma orquestrada na sessão de cadastro.

Fonte de referência de produto: `docs/mvp/003-onboarding-linkedin.md` (design original do
onboarding — adaptar para o estado atual do produto).

---

## User Stories

**US1 — Atualizar perfil (Central de Configurações)**
Como usuária autenticada, quero editar foto, nome, cargo atual, área, LinkedIn e GitHub em
`/configuracoes`, para que o borogodó me conheça melhor e meu espelho seja mais contextualizado.

**US2 — WOW moment no onboarding**
Como nova usuária, quero ser guiada pelo meu primeiro uso numa tela dedicada com uma tarefa
clara, para que eu entenda o valor do produto em menos de 60 segundos e não caia num painel
vazio sem saber o que fazer.

**US3 — AHA moment: reflexão da primeira captura**
Como nova usuária que submeteu minha primeira entrada, quero ver o produto estruturar o que
eu contei e me devolver como evidência organizada, para que eu sinta que o borogodó já sabe
algo relevante sobre mim antes de fechar a tela.

---

## Decisões de UX

### `/configuracoes` — Central de Configurações

- Rota dentro do grupo `(app)` → tem AppShell (sidebar + composer)
- Link no sidebar: ícone de engrenagem (Settings, Lucide) no **rodapé do sidebar desktop**,
  abaixo do nome do usuário, como link secundário. No mobile: ícone de engrenagem no topo
  direito substituindo o círculo de inicial (que vai para `/configuracoes` ao clicar)
- Layout: dois cards verticais empilhados, max-width 640px centrado
  - **Card "Identidade"**: foto circular (upload) + nome (editável) + e-mail (read-only)
  - **Card "Links profissionais"**: LinkedIn URL + GitHub URL (ambos opcionais)
- Cada card tem botão "Salvar" individual — sem "Salvar tudo" global
- Avatar upload: `<input type="file" accept="image/*">` oculto, preview circular 80px,
  max 5 MB, formatos JPEG/PNG/WebP; faz upload para Supabase Storage → atualiza `profiles.avatar_url`
- **Cargo e área NÃO aparecem em formulário** — são atualizados naturalmente pela
  conversa de captura ("virei PM Sênior essa semana" → pipeline extrai e atualiza). A
  configurações não duplica o que o chat já faz melhor.

### `/bem-vindo` — Onboarding (2 etapas)

- Rota **fora** do grupo `(app)` → sem AppShell, tela cheia dedicada
- Gatilho: em `(app)/layout.tsx`, se `profiles.onboarding_completed = false` →
  `redirect('/bem-vindo')`
- Estrutura: 2 etapas — sem etapa de perfil (nome já vem do cadastro; foto e LinkedIn
  não ajudam a chegar no AHA moment mais rápido)

**Etapa 1 — Boas-vindas**
- "Olá, {nome}. Aqui é onde o seu trabalho vira clareza."
- Promessa em 2 linhas + CTA "Vamos começar"
- Tipografia Fraunces, fundo roxo-jambo — tom de revelação, não de burocracia

**Etapa 2 — Loop conversacional de captura (WOW + AHA)**

Este é o coração do onboarding. Substitui a tela estática por uma conversa adaptativa:

1. **Prompt inicial**: "Me conta a última coisa relevante que você fez no trabalho."
   Textarea grande + botão "Contar" + opção secundária "Importar PDF do LinkedIn"

2. **Após submeter**: POST `/api/capture` → mostra reflexo ("Lendo…" → diagnóstico
   estruturado — mesma animação do CaptureConversation)

3. **Avaliação de suficiência** (nova): após cada captura, a IA (Haiku) avalia se
   o conjunto de entradas acumuladas é rico o suficiente para gerar um espelho
   significativo. Retorna `{ sufficient: boolean, follow_up_prompt?: string }`.

4. **Se não suficiente**: mostra o `follow_up_prompt` gerado pela IA como próxima
   pergunta ("Entendi que você liderou o projeto. Qual foi o resultado concreto?
   Pode ser em número ou em mudança visível."). O usuário responde → nova captura
   → nova avaliação → repete.

5. **Se suficiente**: "Agora tenho o suficiente para criar seu espelho." →
   chama `/api/mirror/generate` → exibe revelação progressiva do espelho
   (headline + especialidades) inline na tela de onboarding → CTA "Ver meu espelho
   completo" → `completeOnboardingAction()` → redirect `/espelho`

**WOW moment:** a primeira reflexão que mostra a IA entendendo e estruturando o que
a pessoa fez. Acontece logo após a primeira submissão.

**AHA moment:** o espelho revelado — ver "suas especialidades são X, Y, Z, com base
em evidência real que você me deu" — antes mesmo de sair do onboarding.

**Por que loop e não etapas fixas:** remove o gate arbitrário de "3 entradas
obrigatórias". A IA decide quando há material suficiente, o que pode ser 1 entrada
rica (LinkedIn PDF) ou 2-3 entradas de texto curto. A conversa se adapta.

---

## Fora de escopo

- Deleção de conta / danger zone
- Troca de senha (usuários e-mail+senha)
- Crop de imagem no upload (crop CSS circular, aceita qualquer proporção)
- Notificações / preferências de produto
- Re-onboarding ou múltiplas runs do onboarding
- Perguntas guiadas como terceira modalidade de entrada no onboarding
- Revisão in-line de entradas do LinkedIn PDF no onboarding (mostra contagem e continua)

---

## Requisitos funcionais

- **FR-001**: `/configuracoes` carrega `profiles` completo (incluindo novos campos) via
  Server Component e passa para os cards client-side
- **FR-002**: Avatar upload valida tipo (JPEG/PNG/WebP) e tamanho (≤5 MB) client-side
  antes de enviar para Supabase Storage
- **FR-003**: Cada card de configurações tem feedback inline de sucesso/erro após salvar
- **FR-004**: `(app)/layout.tsx` lê `onboarding_completed` do profile e redireciona para
  `/bem-vindo` se `false`
- **FR-005**: `/bem-vindo` redireciona para `/login` se não autenticado, e para `/espelho`
  se `onboarding_completed = true`
- **FR-006**: `completeOnboardingAction` faz `UPDATE profiles SET onboarding_completed = true`
  e invalida cache
- **FR-007**: O loop de captura do onboarding chama `/api/capture` a cada submissão e
  exibe o reflexo inline antes de avaliar suficiência
- **FR-010**: Após cada captura no onboarding, a IA (Haiku) avalia se as entradas
  acumuladas são suficientes para um espelho significativo via `evaluateSufficiency()`
- **FR-011**: Se não suficiente, `evaluateSufficiency` retorna `follow_up_prompt` que
  é exibido como próxima pergunta da conversa — sem contador, sem gates fixos
- **FR-012**: Quando suficiente, o onboarding chama `/api/mirror/generate` e revela o
  espelho inline (headline + especialidades) antes de redirecionar para `/espelho`
- **FR-008**: Todos os strings de UI via next-intl — zero hardcode nos componentes
- **FR-009**: Mobile-first; toques ≥ 48px; acessibilidade WCAG AA

## Critérios de sucesso

- **SC-001**: Novo usuário vê o WOW moment (reflexo da 1ª captura) em < 60 segundos após
  entrar no onboarding; vê o AHA moment (espelho revelado) na mesma sessão
- **SC-002**: Avatar atualizado aparece no sidebar (via revalidatePath) sem full reload
- **SC-003**: `profiles.onboarding_completed = true` após qualquer caminho de conclusão do
  onboarding (texto conversacional ou PDF do LinkedIn)
- **SC-004**: Usuário existente com `onboarding_completed = true` não é redirecionado para
  `/bem-vindo`
- **SC-005**: `evaluateSufficiency` nunca bloqueia indefinidamente — máximo 3 rodadas de
  follow-up; na 4ª, considera suficiente e gera o espelho com o que tem
- **SC-006**: Cobertura de testes ≥ 80% nos componentes e server actions
