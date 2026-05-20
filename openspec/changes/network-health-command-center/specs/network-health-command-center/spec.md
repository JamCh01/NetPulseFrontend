# Network Health Command Center Spec Delta

## ADDED Requirements

### Requirement: Dashboard Prioritizes Operational Urgency

The logged-in dashboard MUST present current operational urgency before lower-priority summary content.

#### Scenario: Operator opens dashboard during normal operation
- **WHEN** an operator opens `/dashboard`
- **THEN** the page shows an overall health state
- **AND** communicates that no active anomalies need attention when applicable
- **AND** still provides supporting coverage and statistics below the primary state.

#### Scenario: Operator opens dashboard with active anomalies
- **WHEN** anomaly signals are available
- **THEN** the most urgent tasks/incidents are visible before general summary widgets
- **AND** each anomaly provides a clear path into monitoring detail or investigation context.

### Requirement: Dashboard Includes Anomaly-First Task Queue

The dashboard MUST include a task queue ordered around operational attention rather than raw task listing.

#### Scenario: Tasks include degraded signals
- **WHEN** active tasks include degraded, suspicious, or unknown signals
- **THEN** those tasks appear in an anomaly-first queue
- **AND** the queue links each task to the relevant monitoring detail page.

### Requirement: Dashboard Includes Recent Incident Stream

The dashboard MUST surface recent alert or incident-like activity when available.

#### Scenario: Recent alert events exist
- **WHEN** recent alert events are available
- **THEN** the dashboard shows them as a recent incident stream
- **AND** each item exposes enough context for the operator to decide whether to investigate.

#### Scenario: No recent alert events exist
- **WHEN** no recent alert events are available
- **THEN** the dashboard shows a calm empty state
- **AND** the page remains useful through health and coverage summaries.

### Requirement: Existing Dashboard Context Remains Available

The dashboard MUST preserve existing summary and chart context as supporting information.

#### Scenario: Operator needs broader context
- **WHEN** an operator scrolls beyond the urgent workflow
- **THEN** existing stats, health, and monitoring chart summaries remain accessible
- **AND** their placement does not compete with active anomaly information.

