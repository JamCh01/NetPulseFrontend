# Proposal: information-density-polish

## Summary
This change improves readability and action clarity in dense UI areas by increasing critical text legibility and restructuring overloaded per-row task actions.

## Motivation
After foundational accessibility, interaction, and design-system consistency updates, the remaining UX friction is primarily information density. Very small text in navigation/list contexts and too many inline actions in task rows reduce scan speed and increase decision fatigue.

## Scope
In scope:
- Reduce ultra-small text usage for critical labels in targeted navigation/list surfaces.
- Simplify task-row action density by keeping primary action visible and moving secondary actions to an overflow pattern.

Out of scope:
- Global typography system changes.
- Additional responsive architecture changes.
- Backend/API behavior changes for task operations.

## Affected Files
- `src/layouts/app-layout.tsx`
- `src/layouts/public-layout.tsx`
- `src/features/monitoring/pages/monitoring-index-page.tsx`
- `src/features/tasks/pages/tasks-page.tsx`

## Proposed Changes
1. Critical micro-text readability
- Raise the floor for critical small text tokens used in nav/list badges and metadata.
- Preserve visual hierarchy while improving legibility on dark backgrounds.

2. Task-row action simplification
- Keep one primary row action directly visible.
- Move secondary/less-frequent actions to a grouped overflow menu/dialog pattern.
- Preserve existing action semantics and permissions.

## Acceptance Criteria
- Critical text in targeted files is more legible while preserving hierarchy.
- Task rows present a clearer primary action and reduced inline action clutter.
- All existing task actions remain accessible via direct or overflow pathways.
- No functional regression in task management flows.

## Risks and Mitigations
- Risk: raising text size slightly increases visual density in constrained rows.
  - Mitigation: rebalance spacing and truncation at row level.
- Risk: overflow grouping may hide actions users rely on.
  - Mitigation: choose clear primary action and keep menu labels explicit.

## Rollout Plan
1. Update small text tokens in targeted nav/list surfaces.
2. Refactor task row action layout to primary + overflow.
3. Validate readability and action discoverability on common breakpoints.
4. Merge as the final polish change.

## Dependencies
- Depends on previous foundational changes (`accessibility-foundation`, `interaction-and-responsive-baseline`, `design-system-consistency`) being landed first.
