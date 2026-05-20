# NetPulse Frontend Global UI Unification TODO

Last updated: 2026-05-20
Scope: Global cross-page UI consistency, resilience states, and interaction baseline.

## Goal

Unify the full-app experience for loading, error, empty, and fallback flows so users always get a clear, branded, actionable interface instead of fragmented defaults.

---

## Change 1: `global-loading-foundation`

Priority: P0
User value: All loading moments look intentional and consistent, not white/default.

- [x] Define shared loading primitives (`LoadingSpinner`, `LoadingState`, upgraded `Skeleton`).
- [x] Define loading animation/style tokens in global CSS.
- [x] Replace app bootstrap, route suspense, and auth restore loading states.
- [ ] Migrate high-traffic pages (dashboard/tasks/alerts/agents) from ad-hoc loading blocks to shared primitives.
- [ ] Add loading copy guideline (label + hint tone) for consistency.

OpenSpec notes:
- Implementation started and partially completed.
- Continue rollout page-by-page with low risk.

---

## Change 2: `global-error-and-not-found-foundation`

Priority: P0
User value: Failures become recoverable and understandable.

- [ ] Add branded `NotFoundPage` with clear actions (go home, go back, go monitoring).
- [ ] Add app-level `ErrorBoundary` for render crashes.
- [ ] Add reusable `ErrorState` component (title, reason, retry action, secondary action).
- [ ] Replace direct wildcard redirect with explicit 404 route.
- [ ] Add standard copy for network/server/permission/not-found errors.

OpenSpec notes:
- Should be the next immediate change after loading rollout.
- No backend dependency required for first version.

---

## Change 3: `global-empty-state-pattern`

Priority: P1
User value: Users can distinguish "no data" from "failed data" and know what to do next.

- [ ] Add reusable `EmptyState` component with icon, reason, and primary CTA.
- [ ] Standardize empty states for list pages (tasks, alerts, webhooks, users, agents).
- [ ] Ensure filtered-empty and first-time-empty have different messaging.
- [ ] Add inline "clear filters" action where applicable.

OpenSpec notes:
- Depends on error-state semantics from Change 2 for clean separation.

---

## Change 4: `global-feedback-and-toast-system`

Priority: P1
User value: Every important action has immediate visible feedback.

- [ ] Define unified toast styles and severity levels (success, warning, error, info).
- [ ] Standardize async mutation feedback (create/update/delete/rotate/push actions).
- [ ] Prevent duplicate noisy toasts for repeated failures.
- [ ] Add retry or deep-link actions in critical failure toasts.

OpenSpec notes:
- Should align with API error normalization.

---

## Change 5: `global-query-and-api-failure-policy`

Priority: P1
User value: Fewer false failures, predictable retry behavior, better resilience.

- [ ] Define global React Query defaults (`retry`, `staleTime`, refetch strategy).
- [ ] Normalize API error mapping into shared utility (401/403/404/409/500/timeout/offline).
- [ ] Add route-level auth failure handling pattern (avoid scattered logic).
- [ ] Add optional degraded-mode hint when backend health endpoint fails.

OpenSpec notes:
- May require coordinated updates in API hooks.

---

## Change 6: `global-motion-and-transition-consistency`

Priority: P2
User value: App feels cohesive and premium in interaction rhythm.

- [ ] Define motion tokens (duration/easing) for enter/exit/hover/loading.
- [ ] Unify card/table/page transition timing.
- [ ] Reduce overuse of pulse animations; use purposeful motion.
- [ ] Add reduced-motion accessibility fallback.

OpenSpec notes:
- Polish-oriented; do after resilience and state consistency.

---

## Change 7: `global-copy-and-micro-ux-guidelines`

Priority: P2
User value: UI language feels consistent and trustworthy.

- [ ] Define microcopy rules for loading/error/empty/success states.
- [ ] Align zh/en key strings for same tone and clarity.
- [ ] Add short writing examples for common operations.
- [ ] Remove ambiguous terms like generic "failed" without context.

OpenSpec notes:
- Should feed into i18n key cleanup.

---

## Suggested Delivery Order

1. `global-loading-foundation` (finish rollout)
2. `global-error-and-not-found-foundation`
3. `global-empty-state-pattern`
4. `global-feedback-and-toast-system`
5. `global-query-and-api-failure-policy`
6. `global-motion-and-transition-consistency`
7. `global-copy-and-micro-ux-guidelines`

## Definition of Done (Global)

- Every route has consistent loading, empty, error, and not-found handling.
- No white/default fallback blocks in authenticated app flows.
- Retry and recovery paths are visible in all critical failure states.
- UX states are reusable components, not duplicated page-local snippets.
