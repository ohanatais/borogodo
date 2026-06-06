# Borogodó — Instruções para o Claude

## Contexto do produto
@.specify/memory/product-context.md

## Princípios técnicos completos
@.specify/memory/constitution.md

---

## Stack
- Next.js 15 (App Router, Server Components por padrão)
- TypeScript estrito — sem `any`
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL + Auth + Storage + RLS)
- Anthropic API (claude-haiku-4-5 para extração, claude-sonnet-4-6 para espelho/geração)
- next-intl (i18n — pt-BR como fallback global)
- Framer Motion (animações de entrada e transições complexas)
- Lucide React (ícones)
- Vitest + Testing Library (testes)

## Estrutura de pastas
```
src/
  app/              ← Next.js App Router
  components/
    ui/             ← componentes base (sem lógica de negócio)
    features/       ← componentes por feature
  i18n/             ← configuração next-intl
  messages/         ← pt-BR.json, en.json (stub)
  lib/
    ai/             ← wrappers da Anthropic API
    db/             ← Supabase client e queries tipadas
    utils.ts        ← cn() e utilitários
  hooks/            ← custom React hooks
  types/            ← types globais
```

## Processo obrigatório por feature
1. /speckit-specify → descrever o quê/por quê
2. /speckit-clarify → fechar ambiguidades
3. /speckit-plan → arquitetura técnica
4. /speckit-tasks → breakdown
5. /impeccable shape → planejar UX antes de codar
6. /speckit-implement → executar
7. /impeccable audit → checar design antes do PR

## Documentos de referência
- PRD completo: `docs/prd.md`
- Marca e identidade: `docs/marca.md`
- Processo de dev: `docs/dev-process.md`
