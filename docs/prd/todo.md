# NetPulse Frontend v1.1 Roadmap TODO

Last updated: 2026-05-20
Scope: Product-led roadmap aligned with `netpulse-product-requirements-v1.1.md` and `netpulse-v1.1-interaction-strategy.md`.

## Roadmap Principle

Build the product narrative first, then fill platform gaps.

The delivery order should follow the user journey:

1. See what is wrong.
2. Jump into the right diagnosis context.
3. Understand the conclusion before reading raw evidence.
4. Create better monitoring strategies.
5. Fill admin/platform completeness gaps.

---

## Change 1: `network-health-command-center`

Priority: P0
Product function: Network Health / operator home
User value: Help operators identify active issues from the first logged-in screen.

- [ ] Redesign `/dashboard` around operational urgency, not only summary metrics.
- [ ] Add global health strip: overall status, active incidents, affected tasks/regions, degraded agents.
- [ ] Add anomaly-first task queue sorted by severity and recency.
- [ ] Add recent incident stream using alert events and diagnosis-relevant changes.
- [ ] Preserve existing dashboard stats and health card, but place them below the urgent workflow.

Inputs / existing capability:
- `useDashboardStats`
- `useTasks`
- `useMonitoringData`
- `useAlertEvents`
- `useHealth`

OpenSpec notes:
- First major v1.1 interaction rewrite.
- Out of scope: backend changes, route renaming, report export.

---

## Change 2: `alert-to-diagnosis-deeplink`

Priority: P0
Product function: Incident Response -> Link Diagnosis
User value: Turn an alert event into the exact diagnostic context in one step.

- [ ] Add direct diagnose action from alert event rows/details.
- [ ] Pass task, agent/region if available, and time window into monitoring detail navigation.
- [ ] Highlight the selected diagnostic window in monitoring detail.
- [ ] Add clear fallback behavior when event context is incomplete.

Inputs / existing capability:
- `useAlertEvents`
- `useAlertRules`
- `useMonitoringTaskDetail`
- `useMtrList`
- `useMonitoringData`

OpenSpec notes:
- This change connects detection to investigation.
- It should land before deeper monitoring page redesign.

---

## Change 3: `monitoring-diagnosis-summary`

Priority: P1
Product function: Link Diagnosis Workspace
User value: Show a conclusion first, then evidence.

- [ ] Add diagnosis conclusion card to monitoring detail.
- [ ] Summarize current state: healthy, degraded, packet loss, high latency, unreachable, unknown.
- [ ] Summarize impact scope across agents/regions.
- [ ] Provide next actions: inspect MTR, create alert, view related events.
- [ ] Move raw charts/tables below the summary layer.

Inputs / existing capability:
- `useMonitoringData`
- `useMultiAgentMonitoringData`
- `useMonitoringTaskDetail`
- `useMtrList`
- `useAlertEvents`

OpenSpec notes:
- This can initially use frontend-derived heuristics.
- Backend diagnosis scoring can come later if needed.

---

## Change 4: `task-strategy-wizard`

Priority: P1
Product function: Monitoring Strategy
User value: Create a complete monitoring strategy, not just a raw task.

- [ ] Replace or supplement create-task modal with guided steps.
- [ ] Step 1: target identity and protocol.
- [ ] Step 2: probe strategy, interval, packet count, port.
- [ ] Step 3: coverage via agents/regions/groups.
- [ ] Step 4: response setup via alert template and optional webhook linkage.
- [ ] Add alert rule templates: high latency, packet loss, jitter/instability.

Inputs / existing capability:
- `useCreateTask`
- `useAssignAgents`
- `useAgents`
- `useCreateAlertRule`
- `useWebhooks`
- Metadata enum integration from Change 6 can improve this later.

OpenSpec notes:
- Keep existing quick-create path if needed for expert users.
- Do not block this change on Settings Center.

---

## Change 5: `agent-distribution-center`

Priority: P1
Product function: Probe Fleet onboarding
User value: Make it easy to install or update agents.

- [ ] Build Agent Download Center page.
- [ ] List available agent binaries with platform metadata.
- [ ] Add platform/filename filtering.
- [ ] Add one-click download action and empty-state handling.
- [ ] Link from Agents/Releases where appropriate.

API basis:
- `listDownloadsApiV1AgentsDownloadGet`
- `downloadAgentApiV1AgentsDownloadFilenameGet`

OpenSpec notes:
- This is a backend-ready frontend gap.
- It supports the v1.1 story by improving probe fleet onboarding.

---

## Change 6: `runtime-data-sync-foundation`

Priority: P1
Product function: Data consistency and realtime freshness
User value: Reduce stale options and make monitoring feel live.

- [ ] Add metadata-enums service hook and cache layer.
- [ ] Replace high-impact hardcoded enum sources in forms/dropdowns.
- [ ] Integrate `useMonitoringWebSocket` into monitoring detail experience.
- [ ] Add realtime connection status/reconnect feedback.

API / hook basis:
- `/api/v1/metadata/enums`
- `useMonitoringWebSocket`

OpenSpec notes:
- Split into two changes if implementation grows too large:
  `metadata-enums-integration` and `monitoring-realtime-updates`.

---

## Change 7: `platform-settings-console`

Priority: P2
Product function: Platform administration
User value: Allow admins to manage backend-exposed settings without direct API access.

- [ ] Build Settings Center page and admin route.
- [ ] List all settings.
- [ ] Edit single setting.
- [ ] Support bulk save.
- [ ] Add validation, error feedback, and refresh behavior.

API basis:
- `listSettingsEndpointApiV1SettingsGet`
- `getSettingEndpointApiV1SettingsKeyGet`
- `updateSettingEndpointApiV1SettingsKeyPatch`
- `bulkUpdateSettingsEndpointApiV1SettingsBulkPatch`

OpenSpec notes:
- Important for platform completeness, but less central to v1.1 product narrative.

---

## Change 8: `admin-user-management-completion`

Priority: P2
Product function: Admin user management
User value: Complete existing user-management surface.

- [ ] Add user profile update entry in users page or detail panel.
- [ ] Support editable fields aligned with backend user update schema.
- [ ] Preserve disable and change-password flows.
- [ ] Keep role guardrails explicit.

Hook basis:
- `useUpdateUser`

OpenSpec notes:
- Small, contained admin-completeness change.

---

## Change 9: `diagnosis-timeline-and-reporting`

Priority: P2
Product function: Incident narrative and management output
User value: Convert raw monitoring data into reusable reports and incident history.

- [ ] Add diagnosis timeline view combining metrics, alerts, MTR, webhook delivery, and operator actions when available.
- [ ] Add exportable incident summary.
- [ ] Add SLA/availability report concept for selected time ranges.
- [ ] Identify backend gaps for durable incident state if needed.

Inputs / existing capability:
- Monitoring data
- Alert events
- MTR results
- Webhook deliveries

OpenSpec notes:
- This should follow the diagnosis and alert-to-context improvements.
- Backend support may be needed for durable incident lifecycle tracking.

---

## Suggested Delivery Order

1. `network-health-command-center`
2. `alert-to-diagnosis-deeplink`
3. `monitoring-diagnosis-summary`
4. `task-strategy-wizard`
5. `agent-distribution-center`
6. `runtime-data-sync-foundation`
7. `platform-settings-console`
8. `admin-user-management-completion`
9. `diagnosis-timeline-and-reporting`

## Notes

- Each item should become an OpenSpec change before implementation.
- Priority is based on product narrative and user workflow, not only endpoint availability.
- Backend-ready gaps are still tracked, but they are placed where they strengthen v1.1 product value.
