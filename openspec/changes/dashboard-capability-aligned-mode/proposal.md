# Proposal: dashboard-capability-aligned-mode

## Summary

Refactor `/dashboard` into a capability-aligned mode that works cleanly with the currently deployed backend API set, removing hard dependency on missing endpoints.

## Motivation

Current dashboard behavior still assumes these endpoints exist:

- `/api/v1/dashboard/stats`
- `/api/v1/alerts/events`
- `/api/v1/health` (v1 path)

In the deployed backend, those are missing (or partially replaced by `/health`), causing repeated 404 noise and degraded UX. We need a stable dashboard that uses only confirmed backend capabilities.

## Scope

In scope:
- Remove strong dashboard dependency on missing `dashboard/stats` and `alerts/events` endpoints.
- Build dashboard summary from available APIs (tasks/monitoring/health).
- Replace missing-capability error posture with explicit "capability not deployed" presentation.
- Reduce repeated 404 requests by avoiding unsupported endpoint polling once detected.

Out of scope:
- Backend API implementation of missing dashboard/alerts endpoints.
- Full incident-event feature parity.
- Changes to unrelated admin modules.

## Affected Areas

- `src/features/dashboard/pages/dashboard-page.tsx`
- `src/features/dashboard/components/*`
- `src/api/hooks/use-dashboard.ts`
- `src/api/hooks/use-alert-events.ts`
- `src/api/hooks/use-health.ts`
- Optional shared capability flags utility (if extracted).

## Proposed Experience

1. Dashboard should load successfully without runtime crash under current backend.
2. Core summary cards should derive from available data (tasks + monitoring + health), not missing API endpoints.
3. Incident stream section should render as:
   - real data when supported
   - "not deployed yet" capability card when unsupported
4. Console should not continuously spam repeated 404s for known-missing endpoints.

## Acceptance Criteria

- `/dashboard` remains usable with current backend openapi set.
- No dashboard-wide failure caused by missing `dashboard/stats` or `alerts/events`.
- Missing features are communicated as capability gaps, not generic errors.
- Repeated 404 calls for known-missing dashboard dependencies are suppressed after initial detection.
- A1/A2/A3 baseline tests remain passable after changes.

## Risks and Mitigations

- Risk: frontend-derived stats differ from future backend aggregate endpoint.
  - Mitigation: isolate derived-stats mapper for easy replacement when backend endpoint arrives.

- Risk: users interpret missing event stream as bug.
  - Mitigation: explicit "capability not deployed" copy with backend alignment note.

## Rollout Plan

1. Implement capability-aligned data model for dashboard.
2. Replace hard-failure UI paths with capability cards.
3. Verify stability against current deployed backend.
4. Keep change isolated for easy rollback if needed.
