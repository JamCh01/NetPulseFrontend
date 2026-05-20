# Proposal: dual-entry-monitoring-route

## Summary

Introduce a dual-entry routing model for monitoring pages:

- Public entry remains available under `/monitoring/*`
- Authenticated app entry is added under `/app/monitoring/*`

Both entries reuse the same monitoring page components, so users keep sidebar/navigation continuity after login while preserving public-access monitoring.

## Motivation

Currently, monitoring detail routes live only in `PublicLayout`.  
When logged-in users click monitoring links from app pages, they navigate out of `AppLayout`, causing sidebar/menu to disappear.

We need a route structure that preserves:

1. Public monitoring access (existing behavior)
2. Logged-in in-app continuity (sidebar and app context stay visible)

## Scope

In scope:
- Add authenticated monitoring routes under `AppLayout`.
- Keep existing public monitoring routes intact.
- Update in-app navigation links to prefer authenticated monitoring routes.
- Reuse existing monitoring page components (no duplicate page implementation).

Out of scope:
- Monitoring feature redesign.
- Authorization logic changes for public monitoring behavior.
- Backend API changes.

## Affected Areas

- `src/router.tsx`
- `src/layouts/app-layout.tsx`
- Internal links in dashboard/tasks/alerts pages that jump to monitoring detail
- Optional shared route helper utility for monitoring path generation

## Proposed Experience

1. Not logged in:
- User can still access `/monitoring/*` via PublicLayout.

2. Logged in:
- User opens monitoring from app pages and lands on `/app/monitoring/*`.
- Sidebar and app shell remain visible.

3. Component reuse:
- `/monitoring/*` and `/app/monitoring/*` render the same monitoring page components.

## Acceptance Criteria

- Public monitoring routes remain available and functional.
- Logged-in navigation to monitoring no longer loses sidebar/app shell.
- No duplicate monitoring page code is introduced.
- Existing monitoring functionality remains intact across both entries.

## Risks and Mitigations

- Risk: mixed link usage creates inconsistent route jumps.
  - Mitigation: centralize monitoring route generation helper and migrate key links.

- Risk: route conflicts or redirect loops.
  - Mitigation: explicit route ordering and targeted manual verification.

## Rollout Plan

1. Add `/app/monitoring/*` routes under authenticated AppLayout.
2. Migrate app-internal links to `/app/monitoring/*`.
3. Validate public and authenticated navigation flows.
4. Keep public routes unchanged for backward compatibility.
