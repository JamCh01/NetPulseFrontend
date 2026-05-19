# Proposal: accessibility-foundation

## Summary
This change establishes the first accessibility baseline for NetPulse Frontend by fixing core semantic and assistive-technology blockers in navigation cards, icon-only controls, and login form semantics.

## Motivation
Current UI behavior includes non-semantic click targets, missing accessible names on icon-only controls, and incomplete form labeling/autofill hints. These issues create keyboard and screen-reader friction and block predictable accessibility behavior.

## Scope
In scope:
- Convert monitoring task cards from `div + onClick` interaction to semantic interactive elements.
- Add accessible names for icon-only controls in app layout.
- Fix login form label/input associations and add autofill-related attributes.

Out of scope:
- Responsive layout redesign.
- Motion/performance transition tuning.
- Typography/theme system unification.
- Information density and action-layout polish.

## Affected Files
- `src/features/monitoring/pages/monitoring-index-page.tsx`
- `src/layouts/app-layout.tsx`
- `src/features/auth/pages/login-page.tsx`

## Proposed Changes
1. Monitoring cards
- Replace non-semantic clickable container with semantic `Link` or `button` pattern appropriate for route navigation.
- Preserve existing visual style and hover behavior.
- Ensure visible keyboard focus state.

2. Icon-only controls
- Add explicit `aria-label` values for mobile menu open/close and sidebar collapse controls.
- Mark purely decorative icons as hidden from assistive tech when needed.

3. Login form semantics
- Bind each `label` to its corresponding input via `htmlFor`/`id`.
- Add meaningful `name` and `autocomplete` attributes for username/password fields.

## Acceptance Criteria
- Monitoring task cards are keyboard accessible and semantically interactive.
- Icon-only controls expose clear accessible names.
- Login form fields are properly labeled and support browser autofill semantics.
- No visual regression in core auth, app layout, and public monitoring entry experience.

## Risks and Mitigations
- Risk: behavior changes in click target handling.
  - Mitigation: keep navigation logic unchanged; validate mouse + keyboard interactions.
- Risk: style regressions from element-type swap.
  - Mitigation: preserve class tokens and focus styles in component markup.

## Rollout Plan
1. Implement semantic and aria updates in scoped files.
2. Verify keyboard traversal and Enter/Space behaviors.
3. Validate login autofill and screen-reader naming semantics.
4. Merge as the first change before broader UI refactors.

## Dependencies
- None. This change is designed to be independent and should land before subsequent UI improvements.
