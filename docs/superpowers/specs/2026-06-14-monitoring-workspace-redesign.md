# Monitoring Workspace Redesign

## Goal

Improve the NetPulse monitoring workspace so Target-level pages read as a coherent operational console. The first pass focuses on `/app/monitoring` and `/monitoring?target_uuid=...`, especially Target summary, protocol sections, Agent filters, ICMP/TCP metric tables, and MTR/IPERF3/Route Trace evidence views.

## Scope

- Keep existing API contracts and routes.
- Keep the current React, Vite, Tailwind, shadcn/ui, lucide, ECharts, and i18n stack.
- Avoid broad restyling of unrelated admin CRUD pages in this pass.
- Do not commit untracked skill directories.

## Design

The Target page becomes a compact workspace:

- Top summary: Target name, status, location, carrier, Anycast state, task count, Agent count, protocol coverage, and Markdown description.
- Protocol sections: ICMP, TCP, MTR, IPERF3, and Route Trace share a consistent header with protocol icon, tasks, Agents, latest sample, Agent selection, and time range controls.
- Agent comparison: protocol headers and metric tables emphasize selected Agent count and per-Agent summaries for the active time window.
- Event evidence: MTR/IPERF3/Route Trace keep timeline-style result selection, but summary labels and empty/loading states should feel consistent with metric sections.
- Refresh continuity: existing stable snapshot behavior remains the baseline. New UI should avoid full-section blanking during background updates.

## Component Plan

- Add small helper components inside `target-monitoring-panel.tsx` for summary stats, protocol coverage, protocol metadata, and shared empty/error states.
- Keep chart and table components separate; only adjust their wrappers and copy when needed.
- Update `mtr-result-views.tsx` summary labels so result evidence reads as a reusable event workbench, not only MTR-specific text.
- Add i18n keys for the new labels in both Chinese and English.

## Verification

- Run targeted monitoring tests if present.
- Run `bun run lint`.
- Run `bun run build`.
- Use browser validation against the dev frontend for the Target monitoring page and check that the page renders without console errors, text overflow, or blank refresh states.
