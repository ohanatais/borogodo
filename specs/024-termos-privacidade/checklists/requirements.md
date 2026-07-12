# Specification Quality Checklist: Termos, Privacidade e Consentimento

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-07-11
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
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- Decisões de produto/legais (sign-in-wrap vs checkbox; migration com aceite versionado + marketing
  separado; gate de re-consentimento para contas atuais) foram resolvidas com a Ohana antes da escrita,
  então a spec entra sem marcadores de esclarecimento.
- Clarificação resolvida ao vivo com a Ohana: consentimento de marketing começa desligado para toda
  conta; opt-in por checkbox desmarcado no cadastro por e-mail/senha e por pergunta desmarcada no
  onboarding para cadastro por Google; editável em configurações. Encodado em US4/FR-013.
- URLs dedicadas fixadas: `/termos-de-uso` e `/politica-de-privacidade` (FR-001).
