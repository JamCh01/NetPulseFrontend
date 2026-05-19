# Information Density Polish Spec Delta

## ADDED Requirements

### Requirement: Critical Small-Text Legibility in Targeted Surfaces
Targeted navigation/list surfaces MUST maintain legible critical text without relying on ultra-small font sizes.

#### Scenario: Reading nav/list critical labels
- **WHEN** users view targeted navigation/list labels on dark backgrounds
- **THEN** critical labels remain readable at standard zoom
- **AND** hierarchy is preserved through weight/contrast/spacing, not ultra-small size alone.

### Requirement: Task Row Action Clarity
Task table rows MUST expose a clear primary action while reducing inline secondary action clutter.

#### Scenario: Scanning task table actions
- **WHEN** users scan task rows for the next action
- **THEN** one primary row action is directly visible
- **AND** secondary actions are grouped in an explicit overflow pattern.

### Requirement: No Loss of Task Operation Coverage
Polish changes MUST preserve full task operation availability and permission behavior.

#### Scenario: Accessing all task operations after action regrouping
- **WHEN** users interact with row actions under their existing role permissions
- **THEN** all previously available operations remain reachable
- **AND** operation outcomes remain functionally unchanged.
