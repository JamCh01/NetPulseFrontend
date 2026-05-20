# Tasks: dashboard-capability-aligned-mode

## 1. Capability Inventory

- [ ] 1.1 Confirm current backend-supported dashboard-relevant endpoints from `/openapi.json`.
- [ ] 1.2 Mark unsupported dependencies (`dashboard/stats`, `alerts/events`, `/api/v1/health`) in dashboard data flow.

## 2. Dashboard Refactor

- [ ] 2.1 Replace `dashboard/stats` dependency with frontend-derived summary from available task/monitoring data.
- [ ] 2.2 Keep health source on `/health` fallback-first path when `/api/v1/health` is unsupported.
- [ ] 2.3 Convert incident stream area to capability-aware section:
- [ ] 2.3.1 render data when available
- [ ] 2.3.2 render "capability not deployed" card when endpoint is unsupported
- [ ] 2.4 Ensure all task target/protocol fields are safely rendered under mixed backend payload shapes.

## 3. Noise Reduction

- [ ] 3.1 Cache unsupported endpoint detection to prevent repeated 404 polling.
- [ ] 3.2 Ensure dashboard does not repeatedly trigger unsupported requests during normal navigation.

## 4. Verification

- [ ] 4.1 Manual verify `/dashboard` renders under current production-like API.
- [ ] 4.2 Verify no runtime crash from missing/nullable `protocol` or object-shaped `target`.
- [ ] 4.3 Run targeted lint on touched files.
- [ ] 4.4 Confirm A1 login + session restore + logout remain unaffected.

## 5. Delivery

- [ ] 5.1 Update backend alignment notes with dashboard capability-aligned status.
- [ ] 5.2 Update roadmap/todo progress for dashboard item.
- [ ] 5.3 Prepare commit summary with before/after behavior.
