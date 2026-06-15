# 010 — Produto Polish: 17 itens de refinamento

Resultado de audit completo (verify) rodado em 2026-06-14 cobrindo todas as telas e
jornadas. Branch: `010-produto-polish`.

Referência de prioridade: Alto = impacto de negócio ou experiência imediato; Médio =
atrito perceptível; Baixo = polimento e consistência.

---

## FASE 1 — Bugs e erros críticos (fazer primeiro)

### T01 — Fix middleware: landing page inacessível para usuários não autenticados
**Arquivo:** `src/proxy.ts`
**Prioridade:** Alto
**Esforço:** XS (~5 min)

O next-intl prefixia o pathname com `/pt` antes do middleware rodar. `PUBLIC_ROUTES`
lista `'/'` mas o middleware vê `/pt` — que não está na lista — e redireciona para
`/login`. Resultado: qualquer visitante não autenticado (marketing, tráfego orgânico,
links compartilhados) nunca vê a landing page.

**Mudança:**
```ts
// src/proxy.ts — função isPublicRoute
function isPublicRoute(pathname: string): boolean {
  const stripped = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '') || '/'
  return PUBLIC_ROUTES.some(
    (route) => stripped === route || stripped.startsWith(route + '/')
  )
}
```
Testar: abrir janela anônima → `localhost:3000` → deve ver a landing page, não o login.

---

### T02 — Remover `textAlign: 'justify'` do intro do Espelho
**Arquivo:** `src/components/features/espelho/MirrorContent.tsx`
**Prioridade:** Alto
**Esforço:** XS (~2 min)

Texto justificado cria "rios" de espaço entre palavras em PT-BR, especialmente em
parágrafos com palavras longas. O parágrafo de intro do Espelho está com
`style={{ textAlign: 'justify' }}`. Remover completamente — left-align é o correto.

---

### T03 — Desabilitar/sinalizar modo "Perguntar" (sem backend)
**Arquivo:** `src/components/layout/AppShellClient.tsx`
**Prioridade:** Alto
**Esforço:** S (~15 min)

O toggle "Registrar | Perguntar" existe em desktop e mobile. O backend do "Perguntar"
retorna 501. Usuário pode clicar, digitar, enviar e receber erro silencioso.

**Opções (escolher uma):**
- A) Desabilitar o botão "Perguntar" com `disabled` + tooltip "Em breve"
- B) Remover o toggle completamente até o backend existir
- C) Ao clicar em "Perguntar", mostrar toast "Em breve — estamos construindo isso"

Recomendo C: mantém a expectativa do produto sem expor o estado quebrado.

---

## FASE 2 — Consistência de identidade visual (alto impacto, baixo esforço)

### T04 — Eliminar padrão ALL CAPS rastreado (eyebrow genérico)
**Arquivos:**
- `src/components/features/painel/TrajectoryHighlights.tsx` — "TRAJETÓRIA EM DESTAQUE"
- `src/components/features/espelho/MirrorContent.tsx` — "NO QUE VOCÊ MANDA BEM",
  "SEM BOROGODÓ", "O FIO DA SUA CARREIRA", "TEMAS DE FORÇA"
- `src/components/features/espelho/MacroCategoryTabs.tsx` — "SUAS SKILLS POR CATEGORIA"
- `src/components/features/painel/MiniTimeline.tsx` — título da mini timeline
**Prioridade:** Alto
**Esforço:** S (~30 min)

`text-xs font-semibold uppercase tracking-widest` é listado explicitamente como
anti-referência no `PRODUCT.md` ("Tiny all-caps tracked eyebrow above every single
section"). Substituir por uma solução de identidade consistente:

**Proposta:** usar um traço colorido curto antes do label, texto em `text-sm font-medium`
lowercase (ou sentence case), cor `var(--color-primary)`. Isso cria identidade própria
sem o eyebrow genérico de SaaS.

```tsx
// Componente reutilizável: SectionLabel
// uso: <SectionLabel>Trajetória em destaque</SectionLabel>
<p className="flex items-center gap-2 text-sm font-semibold mb-3"
   style={{ color: 'var(--color-primary)' }}>
  <span className="w-3 h-px inline-block" style={{ background: 'var(--color-primary)' }} />
  {children}
</p>
```

---

### T05 — Nav mobile: adicionar labels de texto nos ícones
**Arquivo:** `src/components/layout/AppShellClient.tsx` (seção bottom nav mobile)
**Prioridade:** Médio
**Esforço:** S (~20 min)

A bottom nav tem apenas ícones sem labels. `Sparkles` (Espelho) e `GitCommitVertical`
(Linha do Tempo) não têm relação visual óbvia com suas funções. Adicionar labels curtos
abaixo dos ícones:

```tsx
// Em vez de só {item.icon}:
<div className="flex flex-col items-center gap-0.5">
  {item.icon}
  <span className="text-[10px] font-medium">{item.label}</span>
</div>
```

Labels já existem em `NAV_ITEMS` — só precisam ser renderizados.

---

### T06 — Remover "Conteúdo" disabled da nav (ou substituir por "Em breve" fora da nav)
**Arquivo:** `src/components/layout/AppShellClient.tsx`
**Prioridade:** Médio
**Esforço:** XS (~5 min)

Um item cinza desabilitado na navegação principal sinaliza produto incompleto. Opções:
- A) Remover completamente do array `NAV_ITEMS` até a feature existir ← recomendado
- B) Mover para um "badge" no rodapé da sidebar: "Conteúdo — chegando em breve"

---

## FASE 3 — UX e empty states (médio impacto, médio esforço)

### T07 — BorogodoCard em formação: adicionar direção ao usuário
**Arquivo:** `src/components/features/painel/BorogodoCard.tsx`
**Prioridade:** Médio
**Esforço:** S (~20 min)

No estado "em formação" (< 3 entradas), o card diz "Continue capturando histórias" mas
não tem CTA. O usuário não sabe o que fazer além de adivinhar que há uma capture bar
lá embaixo.

Adicionar um micro-CTA ou seta visual dentro do card:
```tsx
// Abaixo do subtítulo de "formação":
<button
  onClick={() => document.querySelector('textarea')?.focus()}
  className="mt-3 flex items-center gap-1.5 text-sm font-medium opacity-80 hover:opacity-100"
  style={{ color: 'var(--color-primary-fg)' }}
>
  Contar uma história agora
  <ArrowDown size={14} />
</button>
```

---

### T08 — Highlight card: remover truncamento do texto principal
**Arquivo:** `src/components/features/painel/TrajectoryHighlights.tsx`
**Prioridade:** Médio
**Esforço:** XS (~5 min)

`line-clamp-2` corta o `what_i_did` no meio da frase. Para uma peça apresentada como
destaque da trajetória, truncar é anti-produto. Remover `line-clamp-2` de `what_i_did`
(manter em `impact` se quiser compactar o impacto secundário).

---

### T09 — Empty state Histórico: energia + CTA explícito
**Arquivo:** `src/components/features/historico/HistoricoTimeline.tsx`
**Prioridade:** Médio
**Esforço:** M (~45 min)

Estado atual: "Nenhuma entrada com cargo e empresa ainda. Conte histórias com seu cargo
e empresa e elas aparecem aqui." — literal e sem vida.

Novo empty state deve ter:
1. Uma representação visual do "fio" que vai ser construído (a linha pontilhada vazia
   com um nó no topo, sugerindo o que vai aparecer)
2. Copy com personalidade: "Seu fio ainda está em branco. Conte uma história com seu
   cargo e empresa — ela aparece aqui como o primeiro nó da sua trajetória."
3. Um botão/link explícito: "Registrar agora" que foca a capture bar

---

### T10 — MirrorFeedback: adicionar contexto ao "Resonou com você?"
**Arquivo:** `src/components/features/espelho/MirrorFeedback.tsx`
**Prioridade:** Médio
**Esforço:** XS (~10 min)

Adicionar uma linha de contexto acima dos botões Sim/Não:
```tsx
<p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>
  Sua resposta ajuda o Borogodó a afinar a próxima leitura.
</p>
```

---

## FASE 4 — Onboarding (médio impacto, médio esforço)

### T11 — WelcomeStep: adicionar logo
**Arquivo:** `src/components/features/onboarding/WelcomeStep.tsx`
**Prioridade:** Médio
**Esforço:** XS (~5 min)

A tela roxa de boas-vindas não tem logo. Adicionar `<Logo variant="dark" size="sm" />`
no topo da tela (posição absoluta ou no flex column acima do headline).

---

### T12 — CaptureLoopStep: suavizar transição de fundo
**Arquivo:** `src/components/features/onboarding/CaptureLoopStep.tsx` +
`src/components/features/onboarding/OnboardingShell.tsx`
**Prioridade:** Médio
**Esforço:** S (~20 min)

Step 1 (roxo intenso) → Step 2 (creme) é uma mudança de fundo abrupta. Opções:
- A) Manter o fundo roxo no Step 2 mas com menos intensidade (usar `var(--color-lilas-nevoa)`)
- B) Fazer um cross-fade animado via Framer Motion `layoutId` no background
- C) Adicionar um acento roxo no topo do Step 2 (borda ou gradiente sutil)

Recomendo A: menor esforço, maior consistência visual.

---

### T13 — CaptureLoopStep: enriquecer estados de loading
**Arquivo:** `src/components/features/onboarding/CaptureLoopStep.tsx`
**Prioridade:** Médio
**Esforço:** M (~40 min)

Fases `reading`, `evaluating`, `generating` mostram apenas um spinner com uma linha de
texto. Para um processo que leva 15-30 segundos e é o primeiro contato do usuário com
a IA do produto, a experiência precisa de mais presença.

**Proposta:** criar copy rotativo (3-4 frases em sequência com intervalo de 3s) para
cada fase:
- `reading`: "Lendo o que você me contou..." → "Identificando o que importa..." → 
  "Encontrando o padrão..."
- `generating`: "Montando seu espelho..." → "Escolhendo as palavras certas..." → 
  "Quase lá..."

Usar `useEffect` + `setInterval` com array de mensagens.

---

### T14 — Mirror revealed: momento mais dramático
**Arquivo:** `src/components/features/onboarding/CaptureLoopStep.tsx`
**Prioridade:** Baixo
**Esforço:** S (~20 min)

A fase `revealed` anima com `scale(0.97) → 1` — muito sutil para o momento mais
importante do onboarding. Proposta: usar `y: 20, opacity: 0 → y: 0, opacity: 1` com
`duration: 0.6` e adicionar uma linha de header antes do card:
```tsx
<p className="text-sm font-medium mb-4 text-center" style={{ color: 'var(--color-primary)' }}>
  Aqui está o que eu vi em você.
</p>
```

---

## FASE 5 — Espelho e Configurações (polimento)

### T15 — Espelho: hierarquia visual entre seções
**Arquivo:** `src/components/features/espelho/MirrorContent.tsx`
**Prioridade:** Médio
**Esforço:** S (~25 min)

`primary_strength`, `invisible_skill`, `context_pattern` têm o mesmo peso. O ponto
forte primário deveria ser visualmente dominante.

**Mudança:** aumentar o `headline` de `primary_strength` para `text-2xl` (vs. `text-xl`
das outras), adicionar um acento de cor no card (borda esquerda em `var(--color-primary)`
com `border-l-2`) apenas na seção principal.

---

### T16 — "Gerar novo espelho": melhorar affordance e copy
**Arquivo:** `src/components/features/espelho/MirrorContent.tsx`
**Prioridade:** Baixo
**Esforço:** XS (~10 min)

Substituir o link sublinhado apagado por um botão discreto com ícone e microcopy:
```tsx
<button className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg transition-colors"
  style={{ color: 'var(--muted-foreground)', background: 'var(--muted)' }}>
  <RefreshCw size={13} />
  Pedir uma nova leitura
</button>
<p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
  Usa suas entradas mais recentes
</p>
```

---

### T17 — Configurações: layout two-column no desktop + padding-bottom mobile
**Arquivo:** `src/app/[locale]/(app)/configuracoes/page.tsx` +
`src/components/features/perfil/IdentityCard.tsx` +
`src/components/features/perfil/LinksCard.tsx`
**Prioridade:** Baixo
**Esforço:** M (~30 min)

Dois sub-itens:
- **Desktop:** `max-w-[640px]` deixa ~500px inutilizados numa tela de 1440px. Mudar
  o layout para duas colunas em `lg+`: `IdentityCard` na esquerda, `LinksCard` na
  direita. `max-w-[860px]` com `lg:grid-cols-2 lg:gap-8`.
- **Mobile:** a capture bar sticky sobrepõe o botão "Salvar" de LinksCard. Adicionar
  `pb-32` na página para o scroll ir além do bar.

---

## Ordem de execução recomendada

```
T01 → T02 → T03   (Fase 1, ~30 min total)
T04 → T05 → T06   (Fase 2, ~1h total)
T07 → T08 → T09 → T10  (Fase 3, ~1.5h total)
T11 → T12 → T13   (Fase 4 onboarding, ~1h total)
T14 → T15 → T16 → T17  (Fase 5 polimento, ~1.5h total)
```

Total estimado: ~6h de implementação focada.

---

## Contexto de arquitetura

- Stack: Next.js 15 App Router, React 19, TypeScript strict, Tailwind v4, shadcn/ui
- Tokens de cor: `var(--color-primary)` (roxo), `var(--color-primary-fg)` (creme),
  `var(--color-lilas-nevoa)` (lilás suave), `var(--color-accent)` (coral/faísca)
- Font display: `var(--font-display)` (Fraunces, serif)
- Componentes UI base em `src/components/ui/`
- Cada mudança é isolada — não há dependências entre tasks exceto T04 que cria um
  componente `SectionLabel` reutilizável usado por T15
