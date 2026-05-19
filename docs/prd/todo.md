# NetPulse Frontend UI/UX Improvement TODO

Last updated: 2026-05-19
Scope: Track UI review findings only. No code changes in this task.

## Change Plan (Workstream Split)

Instead of 1 TODO = 1 change, we split by coupling and rollout risk:

1. `accessibility-foundation`
2. `interaction-and-responsive-baseline`
3. `design-system-consistency`
4. `information-density-polish`

---

## Change 1: `accessibility-foundation`

Priority: P0
Goal: Fix core semantic and assistive-tech blockers first.
Status: Completed (2026-05-19)

- [x] Replace clickable `div + onClick` cards with semantic interactive elements.
  - Files: `src/features/monitoring/pages/monitoring-index-page.tsx`
  - Acceptance:
    - Card uses `Link` or `button` semantics.
    - Focus-visible state is visible.
    - Keyboard Enter/Space works as expected.

- [x] Add accessible names for icon-only buttons.
  - Files: `src/layouts/app-layout.tsx`
  - Acceptance:
    - Each icon-only control has `aria-label`.
    - Decorative icons inside controls are `aria-hidden` when appropriate.

- [x] Fix login form label/input semantics and autofill hints.
  - Files: `src/features/auth/pages/login-page.tsx`
  - Acceptance:
    - `label` is bound with `htmlFor` + input `id`.
    - Inputs include meaningful `name` and `autocomplete` attributes.

---

## Change 2: `interaction-and-responsive-baseline`

Priority: P1
Goal: Improve mobile usability and interaction performance baseline.
Status: Completed (2026-05-19)

- [x] Remove `transition: all` usage in shared UI styles/components.
  - Files:
    - `src/index.css`
    - `src/components/ui/button.tsx`
  - Acceptance:
    - Transition lists explicit properties only.

- [x] Improve PublicLayout responsive behavior on small screens.
  - Files: `src/layouts/public-layout.tsx`
  - Acceptance:
    - Sidebar has mobile pattern (drawer/collapse/overlay) or equivalent adaptive layout.
    - Main content is readable at 375px width.

- [x] Increase touch target sizes for small action controls.
  - Files:
    - `src/components/ui/pagination.tsx`
    - `src/features/tasks/pages/tasks-page.tsx`
  - Acceptance:
    - Primary touch targets are at least 40-44px in one dimension for mobile-friendly usage.

---

## Change 3: `design-system-consistency`

Priority: P1
Goal: Unify global design tokens and theme behavior.
Status: Completed (2026-05-19)

- [x] Align typography system and actual loaded font stack.
  - Files: `src/index.css`
  - Acceptance:
    - Single intentional font strategy documented and applied consistently.

- [x] Wire theme system intentionally (or remove dead path).
  - Files:
    - `src/stores/theme-store.ts`
    - `src/main.tsx`
  - Acceptance:
    - Theme state is initialized and reflected predictably in app runtime.

---

## Change 4: `information-density-polish`

Priority: P2
Goal: Improve readability and reduce UI action noise.
Status: Completed (2026-05-19)

- [x] Reduce ultra-small text usage in navigation/list badges.
  - Files:
    - `src/layouts/app-layout.tsx`
    - `src/layouts/public-layout.tsx`
    - `src/features/monitoring/pages/monitoring-index-page.tsx`
  - Acceptance:
    - Critical text tokens use readable minimum size.

- [x] Simplify dense per-row task actions.
  - Files: `src/features/tasks/pages/tasks-page.tsx`
  - Acceptance:
    - Keep primary action visible; move secondary actions to overflow menu/dialog.

---

## Suggested Execution Order

1. Change 1 (`accessibility-foundation`)
2. Change 2 (`interaction-and-responsive-baseline`)
3. Change 3 (`design-system-consistency`)
4. Change 4 (`information-density-polish`)

## Notes

- This file tracks review findings only.
- Implementation should be done in separate commits by change.
