# Tasks: Canal de contato/suporte (pré-launch)

**Input**: Design documents from `/specs/020-canal-suporte/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md (N/A), contracts/ (N/A), quickstart.md

**Tests**: INCLUÍDOS — o projeto exige TDD e cobertura ≥ 80% (`.claude/rules/ecc/common/testing.md`, constituição II).

**Organization**: agrupado por user story (US1 P1, US2 P2, US3 P2). US1 sozinha já é um MVP entregável.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência)
- Caminhos de arquivo exatos incluídos.

## Path Conventions
Web app Next.js (monolito): código em `src/`, testes em `__tests__/` colocalizados.

---

## Phase 1: Setup & Foundational (Shared Infrastructure)

**Purpose**: base de conteúdo e i18n que todas as stories consomem. **Bloqueia todas as US.**

- [ ] T001 Criar `src/lib/support/channels.ts` exportando as constantes `SUPPORT_EMAIL = "admin@borogodo.ai"` e `LINKEDIN_URL = "https://www.linkedin.com/in/ohana-ta%C3%ADs/"` (URL percent-encoded, ver research.md R3), com tipos explícitos.
- [ ] T002 [P] Adicionar o namespace `support` em `src/messages/pt-BR.json` (chaves: `heading`, `emailLabel`, `copyButton`, `copied`, `copyFailed`, `linkedinLabel`, `linkedinCta`, `sla`).
- [ ] T003 [P] Adicionar o mesmo namespace `support` em `src/messages/en.json` com as traduções correspondentes (pt-BR é fallback).

**Checkpoint**: conteúdo e strings disponíveis para os componentes.

---

## Phase 2: User Story 1 — E-mail copiável sem `mailto:` (Priority: P1) 🎯 MVP

**Goal**: usuário encontra a seção de contato e copia o e-mail com um clique, sem disparar app nativo.

**Independent Test**: abrir rodapé da LP e `/configuracoes`, ver o e-mail como texto, clicar "copiar" e confirmar cópia + feedback, sem app de e-mail nativo abrir.

### Tests (RED first)
- [ ] T004 [P] [US1] Teste de `CopyButton` em `src/components/ui/__tests__/CopyButton.test.tsx`: copia o texto via clipboard (mock de `navigator.clipboard.writeText`), mostra feedback de sucesso, e mostra mensagem de falha quando a API rejeita/está ausente (FR-002, FR-009).
- [ ] T005 [P] [US1] Teste de `ContactCard` em `src/components/features/support/__tests__/ContactCard.test.tsx`: renderiza o e-mail como texto, inclui o `CopyButton`, e NÃO renderiza nenhum `href="mailto:"` como gesto principal (FR-001, FR-003).

### Implementation (GREEN)
- [ ] T006 [US1] Criar `src/components/ui/CopyButton.tsx` (`"use client"`): recebe `value` e rótulos via props, usa `navigator.clipboard.writeText`, estado de feedback com `aria-live="polite"`, fallback de falha sem travar, acessível por teclado (FR-002, FR-009, WCAG AA).
- [ ] T007 [US1] Criar `src/components/features/support/ContactCard.tsx` (Server Component): exibe `heading`, o e-mail (`SUPPORT_EMAIL`) como texto selecionável + `CopyButton`; consome `lib/support/channels.ts` e i18n `support`. (LinkedIn e SLA entram em US2/US3.)

**Checkpoint**: o bloco de contato com e-mail copiável funciona isoladamente.

---

## Phase 3: User Story 2 — LinkedIn secundário (Priority: P2)

**Goal**: link secundário para o LinkedIn da fundadora, rotulado como conversa/feedback.

**Independent Test**: ver o link de LinkedIn na seção, rotulado como secundário, abrindo o perfil correto em nova aba.

### Tests
- [ ] T008 [P] [US2] Estender `ContactCard.test.tsx`: quando `LINKEDIN_URL` está definida, renderiza um link com `target="_blank"` e `rel="noopener noreferrer"` apontando para a URL; quando ausente/vazia, o link é omitido (FR-005, edge case).

### Implementation
- [ ] T009 [US2] Adicionar ao `ContactCard.tsx` o link secundário de LinkedIn (rótulo `linkedinLabel`/`linkedinCta`), aberto em nova aba com `rel="noopener noreferrer"`, omitido quando a URL não está configurada (FR-005).

**Checkpoint**: contato com e-mail + LinkedIn completo no componente.

---

## Phase 4: User Story 3 — SLA honesto + i18n (Priority: P2)

**Goal**: microcopy de expectativa de resposta, tudo internacionalizado.

**Independent Test**: ver a frase de SLA na seção; trocar idioma para `en` e confirmar todos os textos traduzidos.

### Tests
- [ ] T010 [P] [US3] Estender `ContactCard.test.tsx`: renderiza a microcopy de SLA (chave `support.sla`); validar que renderiza com o provider de i18n nos dois idiomas sem chave faltante (FR-007, FR-008).

### Implementation
- [ ] T011 [US3] Adicionar a microcopy de SLA ao `ContactCard.tsx` usando a chave `support.sla` (FR-007). Revisar pt-BR/en das chaves do namespace `support` (FR-008).

**Checkpoint**: `ContactCard` completo (e-mail + LinkedIn + SLA), bilíngue.

---

## Phase 5: Integração nos pontos de entrada (FR-004)

**Purpose**: plugar o `ContactCard` no rodapé da LP e na Central de Configurações.

- [ ] T012 [P] Criar `src/components/features/landing/Footer.tsx` (Server Component) que renderiza `ContactCard` + créditos mínimos, mobile-first.
- [ ] T013 Editar `src/app/[locale]/page.tsx` para renderizar `<Footer />` ao fim da landing (após `CtaSection`).
- [ ] T014 Editar `src/app/[locale]/(app)/configuracoes/page.tsx` para incluir o `ContactCard` na grade de cards (junto de `IdentityCard`/`LinksCard`).
- [ ] T015 [P] Teste de `Footer` em `src/components/features/landing/__tests__/Footer.test.tsx`: renderiza o `ContactCard`.

**Checkpoint**: canal acessível dos dois pontos de entrada.

---

## Phase 6: Polish & Validação

- [ ] T016 Rodar a suíte de testes e garantir cobertura ≥ 80% nos arquivos novos (`npm test`).
- [ ] T017 `/code-review medium` nos arquivos novos/editados; checar `vercel-react-best-practices` (island client mínimo) e WCAG AA via `/impeccable audit`.
- [ ] T018 Validação manual seguindo `quickstart.md` (rodapé LP, copiar, LinkedIn, SLA, Configurações, i18n, teclado/leitor de tela).

---

## Dependencies & Parallelism

- **Phase 1** (T001–T003) bloqueia tudo. T002/T003 em paralelo.
- **US1** (T004–T007) é o MVP; T004/T005 (testes) em paralelo antes de T006/T007.
- **US2** (T008–T009) e **US3** (T010–T011) dependem do `ContactCard` (T007); são incrementos sobre o mesmo arquivo → fazer em sequência entre si, mas independentes do `Footer`.
- **Phase 5**: T012 e T015 [P]; T013/T014 dependem de T012/T007.
- **Phase 6** por último.

## MVP sugerido
**US1 + integração mínima** (T001–T007, T012–T014): canal acessível com e-mail copiável dos dois
pontos de entrada. LinkedIn (US2) e SLA refinado (US3) são incrementos de polimento sobre o mesmo card.

## Independent test criteria
- **US1**: copiar e-mail funciona dos dois pontos, sem app nativo.
- **US2**: link de LinkedIn secundário abre o perfil em nova aba; some se não configurado.
- **US3**: SLA visível; tudo traduzido em pt-BR/en.

## Total: 18 tarefas (US1: 4 · US2: 2 · US3: 2 · setup: 3 · integração: 4 · polish: 3)
