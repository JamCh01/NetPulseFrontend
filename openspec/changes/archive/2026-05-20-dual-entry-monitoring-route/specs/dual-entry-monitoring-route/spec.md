# Dual Entry Monitoring Route Spec Delta

## ADDED Requirements

### Requirement: Monitoring Must Support Public And Authenticated Route Entries

The application MUST provide two route entries for monitoring views:

1. Public entry under `/monitoring/*`
2. Authenticated app entry under `/app/monitoring/*`

Both entries MUST render the same monitoring page components.

#### Scenario: Public monitoring access
- **WHEN** an unauthenticated user opens `/monitoring` or its detail routes
- **THEN** the page is rendered via public layout
- **AND** access remains available as before.

#### Scenario: Authenticated monitoring access from app
- **WHEN** a logged-in user navigates to monitoring from app pages
- **THEN** navigation uses `/app/monitoring/*`
- **AND** the app shell/sidebar remains visible.

### Requirement: App-Internal Monitoring Links Must Preserve App Shell

App-internal links that jump to monitoring MUST prefer authenticated monitoring routes.

#### Scenario: Open monitoring from dashboard or task list
- **WHEN** a logged-in user clicks a monitoring link inside AppLayout pages
- **THEN** the destination stays within authenticated monitoring routes
- **AND** the user does not lose navigation context.
