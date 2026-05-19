# Tasks: information-density-polish

## 1. Implementation
- [x] 1.1 Increase critical micro-text sizes in `src/layouts/app-layout.tsx` where nav/list readability is currently below target.
- [x] 1.2 Increase critical micro-text sizes in `src/layouts/public-layout.tsx` for task list readability.
- [x] 1.3 Increase critical micro-text sizes in `src/features/monitoring/pages/monitoring-index-page.tsx` for badges/meta labels.
- [x] 1.4 Refactor `src/features/tasks/pages/tasks-page.tsx` row actions to primary action + overflow menu pattern.
- [x] 1.5 Preserve all existing actions (view/manage/edit/enable-disable/delete/agent management) with unchanged permissions.

## 2. Verification
- [x] 2.1 Readability check: targeted labels are legible on dark surfaces at standard zoom.
- [x] 2.2 Scan-speed check: task rows are easier to parse due to reduced inline action clutter.
- [x] 2.3 Functional check: every existing task action remains reachable and works correctly.
- [x] 2.4 Responsive check: row action layout remains usable on narrow viewports.

## 3. Delivery
- [x] 3.1 Document action-priority rationale (which action remains primary and why).
- [x] 3.2 Prepare PR summary mapped to proposal acceptance criteria.
