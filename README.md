# Borogodó

Camada de memória e inteligência de carreira para o profissional brasileiro.
Borogodó transforma o que você já fez — entregas, decisões, conquistas — num espelho
vivo da sua trajetória: clareza sobre seu valor, um mapa de carreira e conteúdo pronto
para construir presença profissional.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Components) + React 19 + TypeScript estrito
- [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) (Radix primitives)
- [Supabase](https://supabase.com) (PostgreSQL + Auth + Storage + RLS)
- [Anthropic API](https://www.anthropic.com/api) (Claude Haiku para extração, Claude Sonnet para espelho/geração)
- [next-intl](https://next-intl.dev) (i18n — pt-BR como fallback)
- [Framer Motion](https://www.framer.com/motion/) (animações)
- [Vitest](https://vitest.dev) + Testing Library (testes unitários e de integração)

## Como rodar localmente

### Pré-requisitos

- Node.js 24+
- Um projeto [Supabase](https://supabase.com) (recomenda-se um projeto separado para
  desenvolvimento — veja `.env.example`)
- Uma chave da [Anthropic API](https://console.anthropic.com)

### Setup

```bash
npm install
cp .env.example .env.local
# preencha .env.local com suas credenciais (Supabase, Anthropic, etc.)
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

> As variáveis de ambiente necessárias e onde encontrá-las estão documentadas em
> `.env.example`. Nunca commite `.env.local` — ele já está no `.gitignore`.

### Scripts

```bash
npm run dev      # servidor de desenvolvimento
npm run build    # build de produção
npm run start    # roda o build de produção localmente
npm run lint     # eslint
npx tsc --noEmit # checagem de tipos
npx vitest       # testes
```

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
specs/              ← artefatos de planejamento por feature (spec-driven development)
docs/               ← PRD, brand book, processo de desenvolvimento
```

## Documentação

- [PRODUCT.md](./PRODUCT.md) — produto, personas, proposta de valor
- [DESIGN.md](./DESIGN.md) — sistema de design e identidade visual
- [docs/dev-process.md](./docs/dev-process.md) — processo de desenvolvimento, do zero ao deploy
- [docs/marca.md](./docs/marca.md) — marca e identidade
- `specs/` — spec, plano técnico, modelo de dados e tasks de cada feature

## Deploy

O deploy é feito via [Vercel](https://vercel.com), com integração automática a partir do
branch `main`. As variáveis de ambiente de produção e preview são configuradas em
**Project → Settings → Environment Variables** no painel do Vercel — devem apontar para
projetos Supabase e chaves Anthropic distintos dos usados em desenvolvimento.
