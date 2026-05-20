# Global Error And Not Found Foundation Spec Delta

## ADDED Requirements

### Requirement: Unknown Routes Render Explicit Not Found Experience

The application MUST render an explicit, branded 404 experience for unknown routes.

#### Scenario: User opens an unknown path
- **WHEN** the requested route does not match any registered path
- **THEN** the app renders a dedicated Not Found page
- **AND** the page offers clear recovery actions (go home, go back, go monitoring).

### Requirement: Global Render Failures Are Gracefully Contained

The application MUST include an app-level error boundary for render-time failures.

#### Scenario: A route component throws during render
- **WHEN** an uncaught render exception occurs in the route tree
- **THEN** the app displays a branded fallback state instead of a blank/unhandled crash
- **AND** the user is offered a retry/recover action.

### Requirement: API Failure UI Is Consistent Across Core Pages

Core pages MUST use a shared error-state UI for query and API failures.

#### Scenario: Dashboard data request fails
- **WHEN** dashboard queries fail
- **THEN** the page shows the shared error-state UI
- **AND** provides retry behavior without requiring a hard page reload.

#### Scenario: Tasks or alerts request fails
- **WHEN** task or alert list data fails to load
- **THEN** the page shows the same shared error-state pattern
- **AND** the failure presentation is visually and semantically consistent with dashboard failures.
