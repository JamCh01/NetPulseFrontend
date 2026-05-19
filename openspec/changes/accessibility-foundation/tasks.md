# Tasks: accessibility-foundation

## 1. Implementation
- [x] 1.1 Update monitoring cards to semantic interactive navigation elements in `src/features/monitoring/pages/monitoring-index-page.tsx`.
- [x] 1.2 Add visible keyboard focus styling for monitoring cards without changing visual hierarchy.
- [x] 1.3 Add `aria-label` for icon-only controls in `src/layouts/app-layout.tsx` (menu open/close, sidebar collapse).
- [x] 1.4 Ensure decorative icons in icon-only controls are hidden from assistive tech where appropriate.
- [x] 1.5 Add form `id`/`htmlFor` bindings for login fields in `src/features/auth/pages/login-page.tsx`.
- [x] 1.6 Add `name` and `autocomplete` attributes to login username/password inputs.

## 2. Verification
- [x] 2.1 Keyboard verification: cards and icon-only controls are tab-reachable and actionable by Enter/Space.
- [x] 2.2 Screen reader verification: icon-only controls announce meaningful names.
- [x] 2.3 Form verification: browser autofill recognizes login fields correctly.
- [x] 2.4 Regression check: no visual breakage in auth page, app sidebar/header, and public monitoring list.

## 3. Delivery
- [x] 3.1 Document any intentional UX tradeoffs in change notes.
- [x] 3.2 Prepare PR summary mapped to acceptance criteria from `proposal.md`.
