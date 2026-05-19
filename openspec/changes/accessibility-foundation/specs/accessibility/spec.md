# Accessibility Spec Delta

## ADDED Requirements

### Requirement: Semantic Monitoring Card Navigation
The monitoring task list MUST use semantic interactive elements for route navigation instead of non-semantic clickable containers.

#### Scenario: Keyboard navigation on monitoring task card
- **WHEN** a user tabs to a monitoring task card
- **THEN** the card is focusable with a visible focus state
- **AND** pressing Enter activates navigation to the same monitoring detail route as pointer click.

### Requirement: Accessible Names for Icon-Only Controls
Icon-only controls in core app layout MUST expose clear accessible names.

#### Scenario: Screen reader reads app layout icon-only controls
- **WHEN** assistive technology focuses an icon-only control
- **THEN** it announces a meaningful name describing the action
- **AND** decorative icon glyphs are not announced as control names.

### Requirement: Login Form Label and Autofill Semantics
Login form fields MUST provide explicit label bindings and autofill metadata.

#### Scenario: Login form semantic association
- **WHEN** a user or assistive technology inspects the username/password inputs
- **THEN** each input is associated with a visible label via `id` and `htmlFor`
- **AND** each field includes appropriate `name` and `autocomplete` attributes.
