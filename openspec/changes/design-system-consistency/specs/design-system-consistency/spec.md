# Design System Consistency Spec Delta

## ADDED Requirements

### Requirement: Single Authoritative Global Typography Strategy
The frontend MUST define and apply one coherent primary typography strategy across global token and base-layer declarations.

#### Scenario: Global font application
- **WHEN** the app renders global UI text
- **THEN** font selection follows one authoritative strategy
- **AND** conflicting global font declarations do not override each other unpredictably.

### Requirement: Deterministic Theme Initialization and Persistence
Theme behavior MUST initialize predictably at startup and remain stable across page refreshes.

#### Scenario: Theme consistency after reload
- **WHEN** a user refreshes the page after a theme is selected
- **THEN** the same theme is applied on startup
- **AND** document theme classes reflect the persisted theme state.

### Requirement: Dark-First Baseline Preservation
Theme consistency changes MUST preserve the intended dark-first visual baseline unless explicitly changed.

#### Scenario: Post-change default visual baseline
- **WHEN** no explicit user theme override exists
- **THEN** the app resolves to the intended baseline theme behavior
- **AND** core pages remain legible and visually consistent.
