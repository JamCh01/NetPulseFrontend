# Tasks: dual-entry-monitoring-route

## 1. Route Foundation

- [ ] 1.1 Add authenticated monitoring routes under `AppLayout`:
- [ ] 1.1.1 `/app/monitoring`
- [ ] 1.1.2 `/app/monitoring/:taskUuid`
- [ ] 1.1.3 `/app/monitoring/:taskUuid/mtr`
- [ ] 1.2 Keep existing public monitoring routes under `PublicLayout` unchanged.

## 2. Navigation Migration

- [ ] 2.1 Update app-internal monitoring links (dashboard/tasks/alerts/layout task shortcuts) to authenticated monitoring paths.
- [ ] 2.2 Ensure public pages still link to `/monitoring/*` paths.
- [ ] 2.3 (Optional) Add helper utility for monitoring path generation to avoid hardcoded mismatch.

## 3. Behavior Verification

- [ ] 3.1 Logged-out user can access `/monitoring/*` normally.
- [ ] 3.2 Logged-in user opening monitoring from app pages stays inside app shell/sidebar.
- [ ] 3.3 Direct open of `/app/monitoring/*` requires auth and behaves correctly.
- [ ] 3.4 No route loop or unexpected redirect behavior.

## 4. Delivery

- [ ] 4.1 Update docs with dual-entry route semantics.
- [ ] 4.2 Add short QA notes for public vs authenticated route expectations.
- [ ] 4.3 Prepare commit summary mapped to acceptance criteria.
