# Borogodó — Instruções para o Claude

## O produto
App web de inteligência de carreira para o white-collar brasileiro.
Core duplo: **espelho** (forças/lacunas com evidência) + **geração de conteúdo na voz da pessoa**.
Público: Ana (PM tech), Bruno (vendas), Clara (finanças/admin).

## Stack
- Next.js 15 (App Router, Server Components por padrão)
- TypeScript estrito
- Tailwind CSS + shadcn/ui
- Supabase (PostgreSQL + Auth + Storage + RLS)
- Anthropic API (claude-haiku-4-5 para extração, claude-sonnet-4-6 para espelho/geração)
- Framer Motion (animações)
- Lucide React (ícones)
- Vitest + Testing Library (testes)

## Regras inegociáveis

### Segurança
- NUNCA commitar .env, chaves de API, tokens, secrets
- NUNCA logar dados do usuário (entradas de carreira, histórico, conteúdo gerado)
- NUNCA expor IDs internos do banco em respostas de API
- SEMPRE validar e sanitizar inputs antes de qualquer LLM call
- SEMPRE usar Row Level Security — cada query filtra por user_id = auth.uid()
- Todo endpoint de API verifica autenticação antes de qualquer outra coisa
- Chaves server-side nunca com prefixo NEXT_PUBLIC_

### Qualidade de código
- TypeScript estrito. Sem `any`. Types explícitos em funções de borda.
- Naming em inglês no código. Strings de UI em português.
- Um componente React por arquivo, nome igual ao arquivo.
- Funções: máximo 40 linhas. Se crescer, extrair.
- Tratamento de erro explícito. Sem `.catch(() => {})` vazio.
- Server Components por padrão. "use client" só quando necessário.

### AI calls
- Haiku para extração/estruturação
- Sonnet para espelho e geração de conteúdo
- SEMPRE validar output do LLM antes de persistir no banco
- Cachear resultados de estruturação
- Nunca incluir dados de outros usuários no contexto

### Performance
- Server Components por padrão
- Lazy load componentes pesados
- next/image sempre para imagens

### Acessibilidade
- Todo elemento interativo: label acessível
- Hierarquia de headings semântica
- Contraste mínimo WCAG AA
- Focus visible em todos os elementos interativos

## Design — identidade Borogodó
Marca brasileira, espirituosa e calorosa. Nunca corporativo.
Usar `/impeccable shape` antes de implementar telas novas.
Usar `/impeccable audit` antes de qualquer PR de frontend.

Tokens definidos em `src/app/globals.css`:
- --color-primary: roxo-jambo
- --color-accent: coral-faísca
- --color-warm: mel
- --color-teal: verde-água
- background: creme

Anti-padrões proibidos: gradiente roxo-azul genérico, Inter em tudo, cards aninhados.

## Estrutura de pastas
src/
  app/              ← Next.js App Router
  components/
    ui/             ← componentes base (sem lógica de negócio)
    features/       ← componentes por feature
  lib/
    ai/             ← wrappers da Anthropic API
    db/             ← Supabase client e queries tipadas
    utils.ts        ← cn() e utilitários
  hooks/            ← custom React hooks
  types/            ← types globais

## Processo por feature
1. /speckit.specify → descrever o quê/por quê
2. /speckit.clarify → fechar ambiguidades
3. /speckit.plan → arquitetura técnica
4. /speckit.tasks → breakdown
5. /impeccable shape → planejar UX
6. /speckit.implement → executar
7. /impeccable audit → checar design antes do PR
