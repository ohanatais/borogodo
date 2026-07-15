# Specification Quality Checklist: Registro como Depósito (fundação)

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-07-12
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded (fronteira explícita com features B e C, e com o protótipo
      visual que cobre A+B+C junto)
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- Nenhum item pendente. A spec referencia o protótipo do Claude Design como material visual
  (não como especificação técnica), mantendo a linguagem de negócio no corpo da spec.
- Zero marcadores [NEEDS CLARIFICATION] — as decisões relevantes já estavam fechadas no decision
  record (`docs/decisions/003-registro-deposito-e-captura.md`), incluindo o fatiamento A/B/C que
  define os limites de escopo desta spec.
- 2026-07-12: passe de revisão cruzando a spec com (a) o fluxo de captura real no código
  (`AppShellClient.tsx`, `captureAndReflect.ts`, migrations `007`/`012`) e (b) uma releitura mais
  atenta do protótipo. Resultado: adicionada a User Story 4 (campos manuais sem IA) e os FR-012a,
  FR-017 a FR-020, e ajustadas as Assumptions sobre título/áudio/caminho `marco`/`CaptureComposer`
  órfão — duas decisões de escopo (ponte multi-evento e campos manuais) foram confirmadas
  diretamente com a Ohana antes de entrar na spec.
- 2026-07-12 (segunda rodada): checagem da versão "empty state" mobile (modo "novo" do Painel)
  revelou que o botão "Importar currículo ou LinkedIn" não é feature nova — hoje existe um
  `FileButton` (PDF) na barra fixa que a FR-011 remove. Decisão confirmada com a Ohana: o botão no
  Painel fica visível mas não-funcional (FR-021), e a regressão temporária (ninguém importa PDF
  fora do onboarding entre a 025 e a 026/027) é aceita explicitamente, não um descuido. Também
  adicionado o indicador de progresso "0 de 3" (FR-022), reusando `FIRST_MIRROR_MIN_ENTRIES` já
  existente em `maybeRegenerate.ts` — sem número novo inventado.
- 2026-07-12 (terceira rodada): Ohana trouxe uma segunda iteração visual (`painel-home.html` +
  `home-app.jsx`) — layout de Painel, navegação em grupos e dark mode mais maduros, mas o fluxo de
  Registrar/Registros regrediu (sem confirmação editável, anexos decorativos). Decisão dela:
  adotar layout+nav+dark mode novos, manter a substância de Registrar/Registros da primeira
  iteração. Reescritas US5/US6 (nova US6 de navegação+dark mode; bottom sheet virou US7), FR-011
  a FR-013 ajustados, adicionados FR-023 a FR-026. Esta é a maior expansão de escopo da spec até
  aqui — vale reavaliar tamanho da fatia no `/speckit-plan`. Duas perguntas ficaram como
  assumption/edge case a confirmar no plano técnico: se "Gerar conteúdo"/"Me preparar" já mapeiam
  pra funcionalidade existente, e se o esforço de navegação cabe dentro da 025 ou merece sub-fatia
  própria.
