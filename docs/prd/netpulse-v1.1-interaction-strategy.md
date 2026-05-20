# NetPulse v1.1 Interaction Strategy

Last updated: 2026-05-20
Status: Draft
Related PRD: `docs/prd/netpulse-product-requirements-v1.1.md`

## 1. Purpose

This document translates the v1.1 product direction into interaction design guidance.
It should guide future OpenSpec changes before implementation begins.

The core shift is:

From: feature-oriented monitoring admin console
To: incident-oriented network health command center

## 2. Product Interaction Thesis

NetPulse should not ask users to browse data first.
It should help them answer operational questions first:

1. What is wrong right now?
2. How wide is the impact?
3. What evidence explains it?
4. What should I do next?

The best interaction direction is:

- anomaly first
- diagnosis direct
- conclusion before evidence
- action attached to context

## 3. Core Experience Principles

## 3.1 Anomaly First

Default views should prioritize abnormal tasks, affected regions, recent alerts, and degraded agents.

Normal data remains available, but it should not compete with active incidents.

Implication:
- Dashboard should stop being only a metrics summary.
- Lists should sort and filter by operational urgency.
- Empty/healthy states should communicate confidence, not visual emptiness.

## 3.2 Diagnosis Direct

Users should move from an alert or abnormal metric to the exact diagnostic context in one step.

Implication:
- Alert event -> task detail with time window applied.
- Alert event -> relevant agent/region context applied.
- Alert event -> MTR context when available.

## 3.3 Conclusion Before Evidence

Monitoring detail pages should start with an interpreted summary, then show charts and tables as supporting evidence.

A user should not need to inspect three charts before knowing whether the target is healthy.

Implication:
- Add a conclusion card at the top of monitoring detail.
- Include status, impact scope, suspected cause, and next action.
- Move raw charts below the operational summary.

## 3.4 Action Attached to Context

Actions should appear where the user has enough context to decide.

Implication:
- From abnormal task: jump to diagnosis, create alert, or inspect MTR.
- From alert event: diagnose, acknowledge/resolve later if backend supports it, test webhook.
- From task creation: attach alert template and agent selection before finishing.

## 4. Recommended Navigation Model

Current modules can remain, but labels and default landing behavior should become more result-oriented.

Suggested mental model:

- Dashboard -> Network Health
- Monitoring -> Link Diagnosis
- Alerts -> Incident Response
- Webhooks -> Automation
- Tasks -> Monitoring Strategy
- Agents -> Probe Fleet

This does not require immediate route renaming.
It can start with page titles, sidebar labels, and page-level copy.

## 5. Page-Level Strategy

## 5.1 Dashboard: Network Health Command Center

Primary role:
The logged-in first screen for operators.

It should answer:
- Is anything unhealthy?
- Which tasks or regions are affected?
- What changed recently?
- Where should I click next?

Suggested structure:
- global health strip: overall status, active incidents, affected regions, degraded agents
- anomaly queue: abnormal tasks sorted by severity and recency
- recent incident stream: alerts and diagnosis-relevant events
- compact healthy coverage summary: total active tasks and agents

Priority:
P0. This should be the first major interaction rewrite.

## 5.2 Monitoring Detail: Link Diagnosis Workspace

Primary role:
Deep diagnosis for one task.

It should answer:
- What is the current conclusion?
- Which agents agree or disagree?
- Is the issue local, regional, target-side, or unknown?
- What evidence supports the conclusion?

Suggested structure:
- diagnosis conclusion card
- affected agent/region summary
- time-range aligned charts
- MTR evidence entry point
- raw data and export tools below

Priority:
P1 after dashboard anomaly model exists.

## 5.3 Alerts: Incident Response Center

Primary role:
Turn events into investigation.

It should answer:
- What fired?
- What target and region does it affect?
- How do I jump into the right context?

Suggested structure:
- events grouped by active/recent/resolved state if backend supports it
- direct diagnose action per event
- task, agent, time window, and rule context visible in row/detail

Priority:
P0 because it connects detection to diagnosis.

## 5.4 Task Creation: Monitoring Strategy Wizard

Primary role:
Help users create a complete monitoring strategy, not just a task record.

Suggested flow:
1. Target: domain, IP, URL, port
2. Probe strategy: protocol, interval, packet count
3. Coverage: agents, regions, groups
4. Response: alert template, webhook linkage

Priority:
P1. It should follow the diagnosis improvements so templates reflect real operational patterns.

## 5.5 Diagnosis Timeline

Primary role:
Show the lifecycle of an incident.

Timeline can combine:
- metric degradation
- alert fired
- MTR captured
- webhook delivery
- operator action if available later

Priority:
P2 unless backend already has enough event linkage to make this cheap.

## 6. First Implementation Cut

The first cut should be Dashboard rewrite.

Why:
- It is the first logged-in product impression.
- It can express the new product thesis without needing backend architecture changes.
- It creates a home for future anomaly-first and incident-response work.

Suggested OpenSpec change name:
`network-health-command-center`

Initial scope:
- redesign dashboard information architecture
- add anomaly-first task section
- add recent alerts/events section
- preserve existing stats and health data, but reorder around operational urgency

Out of scope for first cut:
- route renaming
- new backend endpoints
- full incident lifecycle state model
- report export

## 7. Future OpenSpec Change Split

Recommended sequence:

1. `network-health-command-center`
2. `alert-to-diagnosis-deeplink`
3. `monitoring-diagnosis-summary`
4. `task-strategy-wizard`
5. `diagnosis-timeline-and-reporting`

## 8. Success Signals

The redesign is working if:

- operators can identify active issues from the first screen
- alert events lead directly to useful diagnostic context
- monitoring detail pages explain status before requiring chart inspection
- task creation feels like defining a monitoring strategy
- product demos can tell a clear story in under one minute

