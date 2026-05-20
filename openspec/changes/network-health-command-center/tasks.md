# Tasks: network-health-command-center

## 1. Design and Data Mapping

- [x] 1.1 Inventory current dashboard data sources and identify which can support health/anomaly signals.
- [x] 1.2 Define frontend anomaly heuristics for task status using available monitoring/task/health data.
- [x] 1.3 Define healthy/empty states for no anomalies and no alert events.

## 2. Implementation

- [x] 2.1 Rework dashboard layout into health strip, anomaly queue, incident stream, and supporting context.
- [x] 2.2 Add global health strip with overall status, active signal counts, and coverage summary.
- [x] 2.3 Add anomaly-first task queue with direct links to monitoring detail.
- [x] 2.4 Add recent incident stream using alert event data when available.
- [x] 2.5 Preserve existing stats cards, health card, and mini charts below the urgent workflow.
- [x] 2.6 Keep layout usable on mobile and desktop.

## 3. Verification

- [x] 3.1 Verify dashboard renders with healthy/no-anomaly data.
- [x] 3.2 Verify dashboard renders with alert/event data.
- [x] 3.3 Verify anomaly task links navigate to the correct monitoring detail page.
- [x] 3.4 Run targeted lint/test checks for dashboard-related files.

## 4. Delivery

- [ ] 4.1 Document anomaly heuristic limitations in the change notes.
- [ ] 4.2 Update PRD TODO status after implementation.
- [ ] 4.3 Prepare commit summary mapped to acceptance criteria.
