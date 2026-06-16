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
- Open modeling decision for `/speckit-clarify`: opinion/external as new `seed_type` (CHECK migration)
  vs `angle_kind` in `drafts.qa` jsonb (no migration). The moat principle ("external input is an angle,
  proof comes from entries") leans toward `angle_kind`. FR-010 defers to the clarify answer.
- Candidate clarify areas: (1) modeling (angle_kind vs seed_type); (2) is `external` in v1 at all
  (paste-only) or deferred to P-later; (3) evidence-anchor guardrail strictness for opinion/external.
- Migration-number coordination still applies if seed_type route is chosen (≠ 010, after 015 in main).
