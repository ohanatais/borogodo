# Implementation Plan: Canal de contato/suporte (pré-launch)

**Branch**: `020-canal-suporte` | **Date**: 2026-06-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/020-canal-suporte/spec.md`

## Summary

Expor um canal de contato/suporte estático e acessível: e-mail `admin@borogodo.ai` como texto
com botão "copiar" (sem `mailto:` forçado), link secundário para o LinkedIn da fundadora, e uma
microcopy de SLA honesto. Acessível a partir de um **rodapé novo na landing page** e de um **card
novo na Central de Configurações** (`/configuracoes`). Sem formulário, sem persistência, sem
chamada de IA. Toda a UI reaproveita o design system e o i18n (next-intl) já existentes.

## Technical Context

**Language/Version**: TypeScript estrito (Next.js 15, App Router)

**Primary Dependencies**: next-intl (i18n), Tailwind + shadcn/ui, Lucide React (ícones), Clipboard API do navegador

**Storage**: N/A — canal estático. E-mail e URL do LinkedIn vivem como constantes de conteúdo (config), não no banco.

**Testing**: Vitest + Testing Library (unit/componente)

**Target Platform**: Web (mobile-first), navegadores modernos

**Project Type**: Web application (Next.js App Router monolito)

**Performance Goals**: Server-first; o único island client é o botão de copiar. Zero impacto em IA/banco.

**Constraints**: WCAG AA; i18n pt-BR + en obrigatório; micro-interação (feedback de cópia) via estado client mínimo.

**Scale/Scope**: 2 pontos de entrada (rodapé LP + card Configurações), 1 componente de contato reutilizável, ~3 componentes novos.

## Constitution Check

*GATE: deve passar antes da Phase 0 e ser reavaliado após a Phase 1.*

- **I. Security First** ✅ — sem secrets; o e-mail é endereço público de suporte (não credencial). Sem dados de usuário, sem logging, sem query.
- **II. TypeScript Strict & Code Quality** ✅ — sem `any`; identificadores em inglês, strings via i18n; um componente por arquivo; funções < 40 linhas.
- **IV. Server-First & Performance** ✅ — componentes Server por padrão; `"use client"` só no botão de copiar (Clipboard API + feedback é interação de browser estritamente necessária). Sem imagem nova.
- **V. Accessibility (WCAG AA)** ✅ — e-mail como texto real selecionável; botão com rótulo acessível e operável por teclado; foco visível; feedback de cópia anunciado a leitores de tela (`aria-live`).
- **VIII. Mobile-First** ✅ — rodapé e card desenhados mobile-first.
- **IX. i18n** ✅ — novo namespace `support` em `pt-BR.json` e `en.json`; pt-BR como fallback.

**Resultado: PASS.** Nenhuma violação; nenhuma justificativa de exceção necessária.

## Project Structure

### Documentation (this feature)

```text
specs/020-canal-suporte/
├── plan.md              # Este arquivo
├── research.md          # Phase 0 — decisões técnicas
├── data-model.md        # Phase 1 — N/A documentado (sem entidade)
├── quickstart.md        # Phase 1 — como validar manualmente
├── contracts/           # Phase 1 — N/A documentado (sem API)
└── checklists/
    └── requirements.md  # gerado no /speckit-specify
```

### Source Code (repository root)

```text
src/
├── lib/
│   └── support/
│       └── channels.ts            # NOVO: SUPPORT_EMAIL, LINKEDIN_URL (config de conteúdo)
├── components/
│   ├── ui/
│   │   └── CopyButton.tsx         # NOVO ("use client"): botão genérico copiar-para-clipboard + feedback aria-live
│   └── features/
│       ├── support/
│       │   └── ContactCard.tsx    # NOVO: bloco de contato reutilizável (e-mail + CopyButton + LinkedIn + SLA), Server Component
│       └── landing/
│           └── Footer.tsx         # NOVO: rodapé da LP que renderiza ContactCard + créditos
├── app/
│   └── [locale]/
│       ├── page.tsx               # EDIT: adicionar <Footer/> ao fim da landing
│       └── (app)/configuracoes/
│           └── page.tsx           # EDIT: adicionar ContactCard à grade
└── messages/
    ├── pt-BR.json                 # EDIT: namespace "support"
    └── en.json                    # EDIT: namespace "support"

src/components/**/__tests__/       # NOVO: testes de CopyButton e ContactCard
```

## Phase 0 — Research

Ver [research.md](./research.md). Pontos resolvidos: (1) copiar-para-clipboard vs `mailto:`;
(2) Clipboard API + fallback quando indisponível/negado; (3) o `í` na URL do LinkedIn precisa
ser percent-encoded (`ohana-ta%C3%ADs`) para link robusto; (4) onde colocar o rodapé (componente
novo — a LP não tem um hoje).

## Phase 1 — Design

- **data-model.md**: N/A — sem entidade nova (canal estático). Documentado.
- **contracts/**: N/A — sem endpoint novo. Documentado.
- **quickstart.md**: roteiro de validação manual (rodapé LP, card Configurações, copiar, LinkedIn, i18n, teclado/leitor de tela).
- **Agent context**: atualizar via script (hook opcional `agent-context`).

## Phase 2 — Tasks

Gerado pelo `/speckit-tasks` (não por este comando).
