# Implementation Plan: Preparação Conversacional

**Branch**: `027-preparacao-conversacional` | **Date**: 2026-07-19 | **Spec**: [spec.md](./spec.md)

## Summary

Substituir a bifurcação “pronto ou conversar” por uma conversa contextual direta para entrevista,
avaliação e aumento. O chat de preparação ganha pergunta inicial local (zero token), recuperação
semântica baseada no contexto acumulado, citações honestas e enriquecidas com provas, painel maior
e salvamento explícito de uma resposta como preparação. Chats continuam efêmeros. Telemetria não
guarda texto; transcrição só é persistida após opt-in específico. Autoavaliação vira destino próprio
de Usar.

## Technical Context

**Language/Version**: TypeScript 5 strict, React 19, Next.js 16 App Router

**Primary Dependencies**: `@anthropic-ai/sdk`, `@supabase/ssr`, `@supabase/supabase-js`, Zod,
Radix Dialog, `next-intl`, Lucide, Tailwind CSS 4. Nenhuma dependência nova.

**Storage**: Supabase PostgreSQL. Três tabelas aditivas: `preparations`, `preparation_events` e
`shared_chat_feedback`. Registros/evidências existentes permanecem fonte canônica.

**Testing**: Vitest + Testing Library, TDD para contratos, recuperação, UI e RLS/migração.

**Target Platform**: Web responsiva, 375 px até desktop largo.

**Project Type**: Aplicação web única com rotas server-side.

**Performance Goals**: pergunta inicial instantânea e sem IA; primeira resposta mantém streaming;
cards de evidência aparecem no mesmo evento final; salvar preparação conclui em menos de 2 s na
conexão de referência.

**Constraints**: sem histórico automático; sem leitura de URL externa; sem texto bruto em eventos;
somente evidências declaradas no bloco estruturado; chat geral não cresce; todas as queries filtram
usuário e dependem de RLS.

**Scale/Scope**: MVP para early users, até 5 evidências por resposta, 20 mensagens locais por
conversa, 50 preparações listadas por usuário.

## Constitution Check

| Princípio | Avaliação | Aplicação |
|---|---|---|
| I. Security First | ✅ | RLS por `user_id`; autenticação antes de corpo; sem logs de texto; evento rejeita texto livre; share exige consentimento explícito. |
| II. TypeScript | ✅ | Tipos próprios, schemas Zod, arquivos separados e funções pequenas. |
| III. AI-First | ✅ | Sonnet existente; bloco estruturado passa a declarar `evidenceRefs`; nada persistido sem validação. |
| IV. Server-First | ✅ | APIs e queries no servidor; somente chat/ações são client-side; imagens com `next/image`. |
| V. Acessibilidade | ✅ | Dialog com título, foco, teclado, miniaturas acionáveis e alvos de 48 px. |
| VI. TDD | ✅ | Testes falham antes de cada fatia; contratos e fluxos críticos cobertos. |
| VII. Identidade | ⚠️ exceção deliberada | UI operacional de preparação usa sans-serif por decisão explícita da fundadora; Fraunces continua em superfícies editoriais/brand. Shape obrigatório entregue em `shape.md`. |
| VIII. Mobile First | ✅ | Preparação ocupa 100dvh no mobile; desktop expande a partir de `lg`. |
| IX. i18n | ✅ | Toda copy em `pt-BR.json` e estrutura espelhada em `en.json`. |

**Re-check pós-design**: aprovado. A exceção tipográfica é localizada, documentada e motivada por
feedback direto; não transforma todo o produto em uma única família.

## Project Structure

```text
specs/027-preparacao-conversacional/
├── spec.md
├── plan.md
├── research.md
├── shape.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── chat.md
│   ├── preparations.md
│   └── privacy-events.md
└── tasks.md

supabase/migrations/
└── <timestamp>_preparacao_conversacional.sql

src/types/
└── preparation.ts

src/lib/db/
└── preparations.ts

src/lib/ai/chat/
├── answerCareerQuestion.ts
└── prompts/careerChat.ts

src/app/api/
├── chat/route.ts
├── preparations/route.ts
├── preparations/[id]/route.ts
├── preparation-events/route.ts
└── chat/share/route.ts

src/components/features/chat/
├── ChatSheet.tsx
├── ChatMessage.tsx
├── PreparationIntake.tsx
├── ChatEvidenceList.tsx
├── ChatEvidenceCard.tsx
├── SavePreparationButton.tsx
└── ShareConversationDialog.tsx

src/components/features/presenca/
├── UsarLaunchpad.tsx
├── SavedPreparations.tsx
└── RepertorioContent.tsx

src/components/layout/
└── navModel.ts
```

**Structure Decision**: extensão dos módulos existentes, sem novo pacote ou aplicação. Preparações
formam um domínio próprio; não são misturadas a `drafts`, pois não são conteúdo público nem chat.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Headings operacionais em sans-serif | Decisão explícita após teste visual; melhora hierarquia em telas densas | Forçar Fraunces repetiria a inconsistência rejeitada pela fundadora |
