# API Alignment Rollout Plan (2026-05-20)

Scope: Align frontend delivery with current backend capabilities at `http://115.178.32.10:8000/docs`.

## Execution Order

1. Phase A: Validate "frontend-used and backend-matched" capabilities.
2. Phase B: Implement "backend-exists but frontend-not-integrated" capabilities.
3. Phase C: Resolve "frontend-used but backend-missing" gaps.

Do not reorder. Each phase should be completed and signed off before entering the next one.

---

## Phase A: Test Matched Capabilities First

Goal: Verify stable baseline for currently aligned features.

### A1. Auth flow

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

Frontend surfaces to test:
- Login page (`/login`)
- Session restore after refresh
- Logout from header menu

Pass criteria:
- Login succeeds with `admin / change-me`.
- Refresh works without forced logout during normal usage.
- Logout clears local session and returns to login page.

### A2. Task management flow

- `GET /api/v1/tasks`
- `GET /api/v1/tasks/{task_uuid}`
- `POST /api/v1/tasks`
- `PATCH /api/v1/tasks/{task_uuid}`
- `POST /api/v1/tasks/{task_uuid}/disable`
- `POST /api/v1/tasks/{task_uuid}/enable`

Frontend surfaces to test:
- Tasks list page (`/tasks`)
- Task create
- Task edit
- Enable/disable actions

Pass criteria:
- Task list loads without 404.
- Create/edit works.
- Enable/disable works through compatibility path.

### A3. Monitoring detail flow

- `GET /api/v1/monitoring/tasks`
- `GET /api/v1/monitoring/tasks/{task_uuid}`
- `GET /api/v1/monitoring/tasks/{task_uuid}/metrics`
- `GET /api/v1/monitoring/tasks/{task_uuid}/mtr-results`
- `GET /health` (fallback used by health hooks)

Frontend surfaces to test:
- Public monitoring index (`/monitoring`)
- Monitoring detail (`/monitoring/:taskUuid`)
- Dashboard health card/health page fallback behavior

Pass criteria:
- Monitoring list and detail render.
- Metrics chart can load for existing tasks.
- Health checks show valid status via `/health` fallback.

### Phase A exit criteria

- No blocking 404/500 on the above flows.
- Any remaining failures are reproducible and endpoint-specific.

---

## Phase B: Build Backend-Available But Frontend-Not-Integrated

Goal: Increase product value by integrating already-available backend APIs.

Priority order:

1. `GET /api/v1/auth/me` for robust session validation on app init.
2. `/api/v1/metadata/enums` to remove hardcoded enums in forms.
3. Monitoring expansions:
   - `/api/v1/monitoring/agents`
   - `/api/v1/monitoring/agents/{agent_uuid}`
   - `/api/v1/monitoring/task-geo-tree`
   - `/api/v1/monitoring/mtr-results/{result_uuid}`
4. Resource/association flows:
   - `/api/v1/targets*`
   - `/api/v1/relations/quick-associate`
5. Diagnostics visibility:
   - `/api/v1/results/ingestion-events*`

Deliverable for each item:
- OpenSpec change
- Hook + page integration
- Manual test notes

---

## Phase C: Frontend-Used But Backend-Missing

Goal: Resolve major error sources through either backend delivery or frontend product fallback.

Current missing groups:

- Dashboard stats: `/api/v1/dashboard/stats`
- Alerts: `/api/v1/alerts/rules*`, `/api/v1/alerts/events*`
- Webhooks: `/api/v1/webhooks*`
- Users/groups: `/api/v1/users*`, `/api/v1/users/groups*`
- Audit: `/api/v1/audit/logs`
- Agent releases: `/api/v1/agents/releases*`
- Settings: `/api/v1/settings*`
- `/api/v1/health` (only `/health` exists currently)

Resolution strategy:

1. For critical product paths, decide one:
   - backend implements API
   - frontend rewrites to existing API
2. For non-critical admin paths:
   - hide route behind capability flag
   - show "capability not deployed" state instead of hard error

---

## Tracking Template

Use this for each validated item:

- Item:
- Endpoint(s):
- Frontend page:
- Test result: pass/fail
- Notes:
- Next action:
