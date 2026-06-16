# Specification Quality Checklist: Seeds Expandidos de Post

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-06-15
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

- Codebase audit corrected the discovery: `loadSeedEvidence` already handles `project` (closed by 014),
  so the "013 gap" is out of scope. 015 is now merged to `main`, so 018 builds on 013+015.
- Clarify (Session 2026-06-15) resolved: (1) modeling → **`angle_kind` in `drafts.qa` jsonb, NO
  migration** (a post is a post; angle ≠ evidence source; clearer for users, simpler to build/manage);
  (2) **external angle deferred** — v1 ships study + opinion only; (3) opinion guardrail → **lastro =
  registered entry OR lived experience stated in the moment**, with an offer to save that experience as
  an entry (capture nudge, synergy with 016). The moat is "not empty opinion", not "must be in the DB".
- No migration needed (angle_kind route), so the cross-branch migration-number concern is dropped for 018.
- Remaining for `/speckit-plan`: how the capture nudge for stated-lived-experience reuses the capture
  pipeline; `/security-review` (user-provided thesis/experience text to the LLM).
