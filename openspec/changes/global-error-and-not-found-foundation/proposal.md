# Proposal: global-error-and-not-found-foundation

## Summary

Establish a global resilience UI baseline for failure and fallback states: explicit 404 page, app-level error boundary, and shared error-state component across core pages.

## Motivation

The current frontend has inconsistent failure handling:
- Some routes silently redirect.
- Some pages show ad-hoc plain text errors.
- Render-time exceptions do not have a unified recovery UI.

After loading baseline unification, the next priority is to make failure states clear, actionable, and visually consistent.

## Scope

In scope:
- Add a branded `NotFoundPage` route.
- Replace wildcard hard redirect with explicit 404 rendering.
- Add app-level `ErrorBoundary` fallback UI.
- Add shared `ErrorState` component for API/query failures.
- Apply `ErrorState` to high-traffic pages first (dashboard/tasks/alerts).

Out of scope:
- Backend API changes.
- Full rewrite of all pages in one pass.
- External error monitoring platform integration.

## Affected Areas

- `src/router.tsx`
- `src/App.tsx` or root route tree wrappers
- `src/components/ui/*` (new error primitives)
- `src/features/*/pages/*` (initial high-traffic migration)

## Proposed Experience

1. Route not found
- Unknown path renders a branded 404 page.
- Page provides clear recovery actions: go home, go back, go monitoring.

2. Render crash fallback
- Runtime render exceptions show a safe fallback panel instead of blank/unstyled failures.
- User gets retry action and lightweight debug context.

3. API/query failure
- Lists/details use shared `ErrorState` with:
  - clear title
  - concise reason
  - primary retry action
  - optional secondary navigation action

## Acceptance Criteria

- Wildcard route no longer silently redirects; it renders explicit 404.
- Render-time errors are caught by global boundary and show branded fallback.
- At least dashboard, tasks, and alerts pages use shared `ErrorState`.
- Error UI copy and styling are consistent with global loading style.
- No backend dependency required for first release.

## Risks and Mitigations

- Risk: over-generic error copy reduces trust.
  - Mitigation: define mapped copy for common categories (network, permission, not found, server).

- Risk: migration scope gets too large.
  - Mitigation: ship P0 foundation first, then page-by-page rollout.

## Rollout Plan

1. Build `ErrorState` and `NotFoundPage`.
2. Add global `ErrorBoundary`.
3. Switch wildcard routing behavior to explicit 404.
4. Migrate 3 high-traffic pages to unified error state.
5. Validate UX consistency on desktop/mobile.
