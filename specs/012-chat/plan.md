# Chat — Jornada, Gaps e Plano de Implementação (Borogodó)

> **Contexto:** O "Perguntar" existe como stub de UI (toggle visível em desktop e mobile, retorna 501). O usuário precisa de três capacidades distintas via chat: pesquisar informações de carreira, registrar marcos com cuidado, e corrigir dados errados que viu no espelho ou linha do tempo. Este plano cobre todos os cenários, incluindo falhas e iteração ao longo da conversa.

---

## Estado Atual: Diagnóstico

### O que já existe
| Artefato | Status |
|---|---|
| Toggle Registrar/Perguntar (AppShellClient) | UI funcional; Perguntar mostra toast "Em breve" |
| `CaptureInput` com `mode: 'registrar' \| 'perguntar'` | Pronto; envia `kind: 'question'` |
| `CaptureConversation` | Existe mas é para captura/reflexão — não serve para chat |
| `/api/capture` para `kind: 'question'` | **Retorna 501** |
| Embeddings em `entries.embedding` (pgvector HNSW) | Disponíveis para busca semântica |
| `mirror_snapshots` com JSONB completo | Disponível para contexto |
| Enriquecimento: `PATCH /api/entries/[id]/enrich` | Existente, reaproveitável para correções |

### Gaps Críticos

1. **Backend zero** — sem handler de perguntas, sem injeção de contexto do usuário no prompt
2. **UI de chat ausente** — `CaptureConversation` é modal de reflexão; chat precisa de surface persistente e conversacional
3. **Estado de conversa** — single-shot apenas; sem multi-turn, sem histórico na sessão
4. **Zero entry points contextuais** — chat só acessível via bottom bar; `/espelho` e `/historico` não conectam ao chat
5. **Fluxo de correção inexistente** — usuário não tem como sinalizar "isso está errado" em nenhuma página
6. **Descoberta de feature** — "Perguntar" é opaco; nenhum starter prompt, nenhum sinal de capacidade
7. **Mobile cramped** — bottom sheet não construído (decisão registrada)
8. **Sem streaming** — latência percebida alta (resposta full antes de renderizar)
9. **Sem citações** — usuário não sabe se IA está usando dados reais ou inventando

---

## Cenários, Jornadas e Estratégias

### A. Pesquisar (Query de Carreira)

**Exemplo:** "Quais foram meus maiores projetos na empresa X?" / "Quais habilidades ainda não aparecem no meu espelho?"

**Entry points:**
- Toggle "Perguntar" no bottom bar/sheet (qualquer página)
- Chip "Perguntar sobre meu espelho" no topo do `/espelho`
- Botão contextual "Perguntar sobre esta empresa" no `/historico` (quando company está expandida)

**Fluxo ideal:**

```
ChatSheet abre
  → Estado vazio: mostra 3 starter prompts pessoais (gerados a partir dos dados do usuário)
  → Usuário digita pergunta
  → Loading: "Consultando sua carreira..." (skeleton do bubble de resposta)
  → API: carrega mirror + busca semântica top-5 entries relevantes
  → Resposta streamed: texto conversacional + citation chips (badges clicáveis linkando entry/seção)
  → Abaixo da resposta: 2 sugestões de follow-up ("Você também pode perguntar...")
  → Usuário pode continuar a thread ou fechar
```

**Cenários de falha:**
| Falha | Resposta |
|---|---|
| Sem dados suficientes | "Ainda não tenho entradas sobre isso. Quer registrar?" + CTA de captura |
| Pergunta ambígua | AI pede clarificação em-thread: "Você quer dizer [X] ou [Y]?" |
| Erro técnico | Bubble de erro com botão "Tentar novamente" |
| Mirror não gerado ainda | Responde com base em entries; nota que espelho ainda não existe |

---

### B. Registrar Marco (Captura Guiada)

**Distinção importante:** O "Registrar" de texto livre já funciona bem para captura casual. O chat-guided é para marcos que o usuário quer registrar com cuidado e completude — promoção, lançamento de produto, award, encerramento de ciclo.

**Entry points:**
- Detecção de intent em qualquer mensagem no chat ("fui promovido", "lançamos", "recebi um prêmio")
- CTA "Registrar marco" no `/historico` (company view, quando expandida)
- Pode ser descoberto naturalmente via conversa

**Fluxo:**

```
Usuário envia mensagem com sinal de marco
  → AI detecta intent; muda para guided mode
  → Pergunta 1: "Ótimo! Me conta mais. Qual cargo ou empresa está envolvido?"
  → Pergunta 2: "Quando isso aconteceu?"
  → Pergunta 3: "Qual foi o impacto? Tem algum número?"
  → Preview card: campos preenchidos + edição inline antes de salvar
  → "Confirmar e salvar" → POST /api/capture (kind: 'text', conteúdo estruturado)
  → Momento de celebração: "Marco registrado. Seu espelho pode ser atualizado."
```

**Regras de guided mode:**
- Máximo 4 perguntas; não interrogar
- Sempre com opção de pular campo
- Preview antes de confirmar é obrigatório (usuário confirma o que será salvo)
- Se usuário sair no meio, nada é salvo

---

### C. Corrigir Informação (Fluxo de Correção)

**Sem este fluxo, os dados do espelho e linha do tempo se degradam sem saída para o usuário.**

**Entry points:**
- `/espelho`: ícone discreto "incorreto?" em qualquer seção de força ou skill
- `/historico`: botão "Entrada incorreta" no `ProjectDetailPanel` (junto ao "Adicionar via captura" existente)
- Linguagem natural em qualquer conversa de chat: "a linha do tempo está errada"

**Fluxo:**

```
Usuário clica "incorreto" em /espelho ou /historico
  → ChatSheet abre com contexto pré-carregado:
    "Vejo que você está olhando [seção X / entrada Y]. O que está incorreto?"
  → Usuário explica em linguagem natural
  → AI confirma entendimento: "Você quer dizer que [campo específico] está errado. Correto?"
  → Usuário confirma ou refina
  → AI oferece opções:
      a) "Corrigir esse campo" → PATCH /api/entries/[id]/enrich ou novo PATCH /api/entries/[id]
      b) "Remover esta entrada" → soft delete
      c) "Adicionar contexto complementar" → enrich sem deletar
  → Confirmação + se campos de mirror foram afetados:
    "Isso pode afetar seu espelho. Quer regenerar agora?" + botão de regeneração
```

**Princípio de framing:** Corrigir é encorajado, não punitivo. Tom: "ajudar o espelho a ficar mais preciso", nunca "reportar um erro do sistema".

---

## Estratégias de Retenção e Clareza

### Retenção
1. **Primeira resposta surpreende** — starter prompts devem ser gerados a partir dos dados reais do usuário, não texto genérico. Ex: se usuário tem 12 entries sobre produto, starter é "Quais foram seus maiores desafios de produto?"
2. **Citações tornam a IA confiável** — toda resposta inclui citation chips (ex: "Baseado em 3 entradas suas de 2023"). Sem citação → parece alucinação → usuário desconfia
3. **Sugestão de próximo passo** — cada resposta termina com 1-2 follow-ups sugeridos; evita abandono por "e agora?"
4. **Correção bem-sucedida gera satisfação imediata** — confirmação visual + trigger de regeneração de espelho = loop de melhoria visível
5. **Contexto persistente na sessão** — se abriu chat de /historico com empresa X, a conversa toda sabe que é sobre empresa X

### Clareza de Features
1. **Toggle "Perguntar" → abre ChatSheet** (não muda o CaptureInput), separação clara entre capturar e conversar
2. **ChatSheet tem empty state educativo** — starter prompts com exemplos de perguntas reais, não "Como posso ajudá-lo?"
3. **Labels de modo explícitas** — badge "modo de correção" quando chat está no fluxo de correção; "modo de marco" quando guiado
4. **Mobile bottom sheet distinct da capture area** — Perguntar e Registrar vivem em superfícies separadas no mobile

### Tom e Copy
- Sem abertura de IA genérica — não "Olá! Estou aqui para ajudar", não "Certamente!"
- Direto, conversacional, brasileiro — ex: "Encontrei 4 projetos seus na [empresa]. Veja o que se destacou:"
- Honesto quando sem dados: "Ainda não tenho registros sobre isso."
- Celebratório mas conciso em marcos: "Marco salvo." (não "Parabéns! Seu marco foi registrado com sucesso!")

---

## Decisões de Arquitetura

### 1. Nova rota `/api/chat` (não extends `/api/capture`)

Semântica diferente: capture armazena, chat responde. Não misturar.

```ts
// POST /api/chat
Body: {
  message: string
  history?: { role: 'user' | 'assistant'; content: string }[]
  context?: {
    type: 'espelho' | 'historico' | 'empresa' | 'entry'
    entityId?: string  // company name | entry id
  }
}

Response: {
  answer: string           // streamed
  citations: Citation[]    // { label: string; entryId?: string; section?: string }
  suggestions: string[]    // 2 follow-up questions
}
```

**Injeção de contexto (sempre):**
- `mirror_snapshots` mais recente (JSONB completo)
- `profiles` do usuário (nome, area)
- Top-5 entries por busca semântica via embedding
- Se `context.type === 'empresa'`: todas as entries daquela company

**Modelo:** `claude-sonnet-4-6` (não Haiku — qualidade importa para insights de carreira)

**Streaming:** Vercel AI SDK (`streamText`) — response começa a aparecer antes de terminar

### 2. Componente `ChatSheet`

Surface distinta de `CaptureConversation`. Drawer persistente:

- **Mobile:** bottom sheet full-width, estilo Gemini (já decidido)
- **Desktop:** modal side panel (slide from right) ou modal centered
- Não fecha ao click fora — usuário pode estar em meio a uma conversa
- Fecha via botão X explícito ou Escape
- Estado de conversa em `useReducer` local (não Zustand ainda — complexidade desnecessária)

**Sub-componentes:**
- `ChatMessage` — bubble com texto + citations
- `ChatInput` — textarea simples (menor que CaptureInput) + send
- `StarterPrompts` — empty state com 3 prompts calculados no server-side
- `CitationChip` — badge clicável que scroll para a seção referenciada

### 3. Propagação de contexto via eventos customizados

Padrão já usado (`borogodo:capture-context`). Extender com:

```ts
// De /espelho ou /historico para abrir chat com contexto
window.dispatchEvent(new CustomEvent('borogodo:chat-open', { detail: {
  context: { type: 'espelho' | 'empresa', entityId?: string },
  prefillMessage?: string,  // para fluxo de correção
} }))
```

`AppShellClient` escuta e abre `ChatSheet` com estado inicial.

### 4. Correção → atualização de entry

Reaproveita `PATCH /api/entries/[id]/enrich` para campos opcionais.
Criar `PATCH /api/entries/[id]` para campos estruturais (company, role_title, entry_date).
Após correção de campos de mirror, oferecer `POST /api/mirror/generate` via botão na confirmação.

---

## Arquivos a Criar

| Arquivo | O que é |
|---|---|
| `src/app/api/chat/route.ts` | Handler POST com streaming |
| `src/lib/ai/chat/answerCareerQuestion.ts` | Call ao LLM + contexto injetado |
| `src/lib/ai/chat/prompts/careerChat.ts` | System prompt para Q&A de carreira |
| `src/components/features/chat/ChatSheet.tsx` | Surface principal do chat |
| `src/components/features/chat/ChatMessage.tsx` | Bubble de mensagem |
| `src/components/features/chat/ChatInput.tsx` | Input dentro do chat |
| `src/components/features/chat/StarterPrompts.tsx` | Empty state com prompts |
| `src/components/features/chat/CitationChip.tsx` | Badge de citação clicável |

## Arquivos a Modificar

| Arquivo | O que muda |
|---|---|
| `src/components/layout/AppShellClient.tsx` | Toggle Perguntar → abre ChatSheet (não mostra toast) |
| `src/app/api/capture/route.ts` | Remove 501 para `kind: 'question'` (ou redireciona para /api/chat) |
| `src/app/[locale]/(app)/espelho/page.tsx` | Entry points de correção e chat contextual |
| `src/app/[locale]/(app)/historico/page.tsx` | Entry points de correção e "Perguntar sobre esta empresa" |
| `src/messages/pt-BR.json` | Chaves de mensagem para chat, correção, marco |

---

## Fases de Implementação

### Fase 1 — Fundação Q&A (MVP do chat)
- `/api/chat` com contexto básico (mirror + semantic search)
- `ChatSheet` com `ChatMessage`, `ChatInput`, `StarterPrompts`
- Toggle Perguntar → abre ChatSheet
- Sem streaming ainda (full response)

### Fase 2 — Streaming + Multi-turn
- Streaming via Vercel AI SDK
- Histórico de conversa passado à API
- `CitationChip` + suggestions de follow-up
- Mobile bottom sheet

### Fase 3 — Fluxo de Correção
- Entry points em `/espelho` e `/historico`
- Propagação via `borogodo:chat-open` com contexto pré-carregado
- `PATCH /api/entries/[id]` para campos estruturais
- Prompt de regeneração de espelho pós-correção

### Fase 4 — Marco Guiado
- Detecção de intent de marco no chat
- Guided mode multi-turn (max 4 exchanges)
- Preview card antes de salvar
- CTA "Registrar marco" em `/historico`

### Fase 5 — Retenção e Discovery
- Starter prompts personalizados (server-side com dados reais)
- Entry points contextuais gerais de `/espelho` e `/historico`
- Feedback "Isso foi útil?" pós-resposta
- Sugestão proativa de chat após geração de espelho

---

## Verificação End-to-End

- [ ] Q&A básico: perguntar "Quais foram meus maiores projetos?" → resposta com citations
- [ ] Multi-turn: follow-up sobre resposta anterior → coerência de contexto
- [ ] Erro sem dados: pergunta sem entries relevantes → mensagem honesta + CTA de captura
- [ ] Correção via espelho: click "incorreto" → chat abre com contexto → entry atualizada
- [ ] Correção via historico: entry errada → chat corrige → prompt de regenerar espelho
- [ ] Marco guiado: digitar "fui promovido" → AI conduz capture → preview → salvo
- [ ] Mobile: Perguntar → bottom sheet abre corretamente
- [ ] Streaming: resposta aparece progressivamente, não de uma vez
- [ ] Contexto de empresa: abrir chat de /historico com empresa X → respostas são contextuais
