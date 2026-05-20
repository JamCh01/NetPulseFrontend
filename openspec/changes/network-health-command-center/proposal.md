# Proposal: network-health-command-center

## Summary

Redesign the logged-in dashboard into a Network Health Command Center that prioritizes operational urgency: current health, active anomalies, affected scope, and recent incident signals.

## Motivation

The current dashboard is useful as a metric summary, but v1.1 needs the first logged-in screen to answer a sharper operator question: "What is wrong right now, and where should I go next?"

This change starts the product shift from a feature-oriented monitoring admin console to an incident-oriented network health command center.

## Scope

In scope:
- Rework `/dashboard` information architecture around anomaly-first operations.
- Add a global health strip summarizing current operational state.
- Add an anomaly-first task queue.
- Add a recent incident stream using existing alert/event data where available.
- Preserve existing dashboard stats, health card, and mini charts as supporting context.

Out of scope:
- Backend API changes.
- Route renaming.
- Durable incident lifecycle modeling.
- Report export.
- Full monitoring detail redesign.

## Affected Areas

- `src/features/dashboard/pages/dashboard-page.tsx`
- `src/features/dashboard/components/*`
- Existing hooks may be reused:
  - `useDashboardStats`
  - `useTasks`
  - `useMonitoringData`
  - `useAlertEvents`
  - `useHealth`

## Proposed Experience

1. Global health strip
- Shows overall status, active incidents/anomalies, affected task count, affected region/agent signals when available.
- Healthy state should still feel informative, not empty.

2. Anomaly-first task queue
- Surfaces abnormal or suspicious tasks before healthy coverage.
- Sorts by severity and recency using frontend-derived heuristics if backend severity is unavailable.
- Provides direct navigation into monitoring detail.

3. Recent incident stream
- Shows recent alert events and relevant operational changes.
- Provides clear next action to investigate.

4. Supporting context
- Existing stats, system health, and mini charts remain available below the urgent workflow.
- The page should still work when alert/event data is empty.

## Acceptance Criteria

- `/dashboard` clearly answers whether anything needs attention before showing lower-priority summary content.
- Operators can identify and open the most urgent task/incident from the first screen.
- Existing dashboard stats and health information remain accessible.
- Empty/healthy states communicate system confidence rather than appearing blank.
- Implementation uses existing APIs/hooks only.

## Risks and Mitigations

- Risk: frontend-derived anomaly heuristics may be imperfect.
  - Mitigation: label results as operational signals and keep raw supporting data available.

- Risk: dashboard becomes too dense.
  - Mitigation: keep a clear first-screen hierarchy: health strip, anomaly queue, incident stream, supporting context.

- Risk: alert data may be unavailable or sparse.
  - Mitigation: provide graceful empty states and use active task/health data as fallback.

## Rollout Plan

1. Build dashboard layout around the new information hierarchy.
2. Add frontend anomaly derivation using existing monitoring/task data.
3. Add incident stream from existing alert events.
4. Verify desktop and mobile readability.
5. Keep old summary widgets available as secondary context.

