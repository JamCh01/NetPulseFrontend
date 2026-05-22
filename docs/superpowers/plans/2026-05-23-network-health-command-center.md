# Network Health Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild NetPulse monitoring UI into a target-first network health command center backed by current `/api/v1/monitoring/*` APIs.

**Architecture:** Add a focused monitoring API adapter that normalizes target tree, task tree, task list, metrics, and MTR data. Rebuild dashboard and monitoring pages around normalized Target groups and conclusion-first detail views while preserving the existing React/Vite/Tailwind stack.

**Tech Stack:** React 19, Vite 8, TypeScript, Tailwind 4, TanStack Query, ECharts, lucide-react.

---

### Task 1: Monitoring API Adapter

**Files:**
- Create: `src/features/monitoring/lib/monitoring-models.ts`
- Modify: `src/api/hooks/keys.ts`
- Modify: `src/api/hooks/use-public-monitoring-tasks.ts`
- Modify: `src/api/hooks/use-monitoring-task-detail.ts`
- Modify: `src/api/hooks/use-monitoring.ts`

- [ ] Add normalized monitoring types and helpers for Target, Task, Agent, latest result, protocol coverage, status classification, and display labels.
- [ ] Add query keys for monitoring task list, target geo tree, and task geo tree.
- [ ] Update public monitoring hook to return normalized tasks and Target groups.
- [ ] Update task detail hook to preserve agent, target, latest_result, interval, and probe config.
- [ ] Remove MTR-derived metrics mapping from metrics conversion.

### Task 2: Dashboard Command Center

**Files:**
- Modify: `src/features/dashboard/pages/dashboard-page.tsx`

- [ ] Replace task-card dashboard with health status strip.
- [ ] Add Target coverage panel based on grouped monitoring tasks.
- [ ] Add attention queue sorted by missing data and abnormal latest result.
- [ ] Add selected Target evidence panel with protocol and Agent coverage.

### Task 3: Target-First Monitoring Index

**Files:**
- Modify: `src/features/monitoring/pages/monitoring-index-page.tsx`

- [ ] Replace card grid with searchable Target grouped table/list.
- [ ] Add protocol filters for all, ICMP, TCP, and MTR.
- [ ] Show Agent count, protocol coverage, Anycast, carrier, and task rows.
- [ ] Link MTR tasks to `/mtr`; link ICMP/TCP to metrics detail.

### Task 4: Conclusion-First Detail Pages

**Files:**
- Modify: `src/features/monitoring/pages/monitoring-detail-page.tsx`
- Modify: `src/features/monitoring/pages/mtr-detail-page.tsx`

- [ ] Redesign ICMP/TCP detail header around status, Target, Agent, protocol, time range, and latest result.
- [ ] Keep chart rendering for ICMP/TCP and prevent MTR metrics charts.
- [ ] Redesign MTR page around result timeline and hop evidence table.
- [ ] Keep export only for metrics data where it remains accurate.

### Task 5: Navigation and Visual Polish

**Files:**
- Modify: `src/layouts/app-layout.tsx`
- Modify: `src/index.css`

- [ ] Rename primary navigation labels in visible text where needed.
- [ ] Reduce decorative density and introduce command-center utility classes.
- [ ] Verify responsive layout on desktop and mobile.

### Task 6: Verification

**Files:**
- No planned source edits unless verification finds defects.

- [ ] Run `npm run build`.
- [ ] Start `npm run dev`.
- [ ] Browser-check `/dashboard`, `/monitoring`, one ICMP/TCP task detail, and one MTR detail.
- [ ] Fix TypeScript, layout, or runtime issues found during verification.
