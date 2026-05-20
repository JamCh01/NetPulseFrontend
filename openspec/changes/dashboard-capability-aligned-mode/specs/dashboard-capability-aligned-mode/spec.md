# Dashboard Capability Aligned Mode Spec Delta

## ADDED Requirements

### Requirement: Dashboard Must Operate with Deployed Backend Capability Set

The dashboard MUST remain usable when optional aggregate/incident endpoints are not deployed.

#### Scenario: Aggregate stats endpoint is missing
- **WHEN** `/api/v1/dashboard/stats` is unavailable
- **THEN** dashboard summary metrics are derived from available sources
- **AND** the dashboard does not fail or crash.

#### Scenario: Alert events endpoint is missing
- **WHEN** `/api/v1/alerts/events` is unavailable
- **THEN** incident stream renders a capability-not-deployed state
- **AND** the rest of dashboard remains fully usable.

### Requirement: Dashboard Must Prefer Capability Messaging Over Generic Error

Missing backend features MUST be presented as capability gaps, not opaque loading failures.

#### Scenario: Unsupported dashboard feature
- **WHEN** a dashboard sub-feature depends on an endpoint absent from backend deployment
- **THEN** the UI explicitly communicates that the capability is not deployed
- **AND** provides a non-blocking fallback experience.

### Requirement: Dashboard Must Suppress Repeated Unsupported Endpoint Polling

Once an endpoint is confirmed unsupported, the frontend MUST avoid repeated failing calls during normal usage.

#### Scenario: Endpoint repeatedly returns 404
- **WHEN** the dashboard detects a stable 404 for a known optional endpoint
- **THEN** subsequent refresh cycles avoid unnecessary repeat requests
- **AND** preserve fallback/capability UI state.
