# Tasks: global-error-and-not-found-foundation

## 1. Foundation Design

- [x] 1.1 Define global error categories and user-facing copy baseline.
- [x] 1.2 Define `ErrorState` API (title, description, retry, secondary action, variant).
- [x] 1.3 Define 404 recovery actions and placement rules.

## 2. Implementation

- [x] 2.1 Add reusable `ErrorState` component in `src/components/ui`.
- [x] 2.2 Add branded `NotFoundPage`.
- [x] 2.3 Add global `ErrorBoundary` with graceful fallback UI.
- [x] 2.4 Update router wildcard behavior to render explicit 404 page.
- [x] 2.5 Migrate dashboard page errors to `ErrorState`.
- [x] 2.6 Migrate tasks page errors to `ErrorState`.
- [x] 2.7 Migrate alerts page errors to `ErrorState`.

## 3. Verification

- [x] 3.1 Verify unknown route renders 404 page with recovery actions.
- [x] 3.2 Verify injected render error is caught by `ErrorBoundary`.
- [x] 3.3 Verify retry actions trigger expected query refetch behavior.
- [x] 3.4 Run targeted lint checks for touched files.

## 4. Delivery

- [ ] 4.1 Update `docs/prd/global-ui-unification-todo.md` progress.
- [ ] 4.2 Record rollout notes for remaining page migrations.
- [ ] 4.3 Prepare commit summary mapped to acceptance criteria.
