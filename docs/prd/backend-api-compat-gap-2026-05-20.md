# Backend API Compatibility Gap (2026-05-20)

Scope: Frontend runtime compatibility against the currently deployed API at `http://115.178.32.10:8000`.

## Confirmed Available (from `/openapi.json` check)

- `/health`
- `/api/v1/tasks`
- `/api/v1/tasks/{task_uuid}`
- `/api/v1/tasks/{task_uuid}/disable`
- `/api/v1/tasks/{task_uuid}/enable`
- `/api/v1/monitoring/tasks`
- `/api/v1/monitoring/tasks/{task_uuid}`
- `/api/v1/monitoring/tasks/{task_uuid}/metrics`
- `/api/v1/monitoring/tasks/{task_uuid}/mtr-results`

## Confirmed Missing (frontend currently references these)

- `/api/v1/dashboard/stats`
- `/api/v1/alerts/events`
- `/api/v1/alerts/rules`

Impact:
- Dashboard summary stats cannot be loaded from backend, must degrade gracefully.
- Incident/event stream cannot be loaded, must show unsupported/empty fallback.
- Alert rules page cannot function fully until backend exposes rules endpoints.

## Path Contract Mismatch

- Backend uses **no trailing slash** style (example: `/api/v1/tasks`).
- Existing generated frontend SDK still calls many **trailing slash** paths (example: `/api/v1/tasks/`), causing redirect/404 risk depending on deployment behavior.

## Compatibility Actions Applied in Frontend

1. `useTasks` switched to direct runtime calls against no-slash task routes.
2. `useDisableTask` now prefers `POST /api/v1/tasks/{task_uuid}/disable` with fallback to older delete behavior.
3. `useUpdateTask` now falls back to `/enable` or `/disable` for active toggle when patch route is unavailable.
4. `useAlertRules` and `useAlertEvents` now treat 404 as unsupported capability instead of hard failure.
5. `useHealth` already supports fallback from `/api/v1/health` to `/health`.

## Recommended Next Step

- Re-generate frontend SDK from the deployed backend `openapi.json` to remove route drift and trailing-slash inconsistencies across all modules.
