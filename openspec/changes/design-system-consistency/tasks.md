# Tasks: design-system-consistency

## 1. Implementation
- [x] 1.1 Consolidate global font declarations in `src/index.css` to one intentional primary strategy.
- [x] 1.2 Remove conflicting font overrides in token/base layers that can cause drift.
- [x] 1.3 Audit `src/stores/theme-store.ts` startup behavior and ensure deterministic theme class application.
- [x] 1.4 Align app entry (`src/main.tsx`) with the selected theme initialization path.
- [x] 1.5 Remove or simplify dead/unreachable theme wiring if found.

## 2. Verification
- [x] 2.1 Refresh-cycle check: theme remains stable and predictable after reload.
- [x] 2.2 Startup check: initial theme class is applied as expected on first paint path.
- [x] 2.3 Visual check: auth, monitoring, tasks, and dashboard retain expected readability and hierarchy.

## 3. Delivery
- [x] 3.1 Document selected font strategy and rationale in change notes.
- [x] 3.2 Prepare PR summary mapped to proposal acceptance criteria.
