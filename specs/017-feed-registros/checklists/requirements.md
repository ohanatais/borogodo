# Specification Quality Checklist: Feed de Registros (+ grade-faísca)

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

- Codebase audit embedded in the spec ("Estado atual do código"): the feature evolves existing surfaces
  (`getHistoricoData`, `EntryItem`/`RecentEntries`/`TrajectoryHighlights`, `entries` with
  `evidences`/`embedding`/HNSW) — not greenfield. The only genuinely new column is `title`.
- Cross-branch migration-number collision flagged (FR-019 / Assumptions): 015 reserved `010`
  unmerged, so 017's migration must take the next free number per merge order (likely `011`).
- Clarify (Session 2026-06-15) resolved: (1) grid cell granularity (day vs week) → **deferred to
  `/impeccable shape`** (test with real persona frequency); (2) default time axis → **"quando anotei"
  (`created_at`)**; (3) semantic search → **out of v1 (textual only)**, plus a new requirement
  surfaced by Ohana — **delete a record from the feed** (FR-003a), since the raw feed is where the
  user spots duplicates (reuses existing `DELETE /api/entries/[id]`; UI is new).
- Remaining for `/speckit-plan`: confirm the migration number (not `010`) per merge order;
  `/security-review` flagged (extraction, new column, search with user input, delete action).
