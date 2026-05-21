## ADDED Requirements

### Requirement: VisionOS SpatialScene tracks page generation

VisionOS `SpatialScene` SHALL maintain a current page generation value that advances when the main page lifecycle enters a new navigation or refresh boundary.

#### Scenario: Main page starts loading

- **WHEN** the main `WKWebView` reports the start of a page load
- **THEN** `SpatialScene` SHALL advance its current page generation before accepting new generation-aware SpatialDiv creation requests

#### Scenario: Navigation reset is requested

- **WHEN** `resetForNavigation()` clears existing spatial objects
- **THEN** the same page generation boundary semantics SHALL apply

### Requirement: VisionOS consumes SpatialDiv request epoch

VisionOS native SpatialDiv creation handling SHALL read `wsepoch` from `webspatial://createSpatialized2DElement` requests when present.

#### Scenario: Request epoch matches current generation

- **GIVEN** a SpatialDiv creation request carries `wsepoch` equal to the current scene generation
- **WHEN** VisionOS handles the open-window request
- **THEN** the request MAY create and return a `Spatialized2DElement` content host

#### Scenario: Request epoch is stale

- **GIVEN** the current scene generation is `G2`
- **AND** a SpatialDiv creation request carries `wsepoch=G1`
- **WHEN** VisionOS handles the open-window request
- **THEN** VisionOS SHALL treat the request as stale
- **AND** SHALL NOT attach that request's SpatialDiv content to the current scene

#### Scenario: Request epoch is missing during compatibility phase

- **GIVEN** a SpatialDiv creation request does not carry `wsepoch`
- **WHEN** VisionOS handles the open-window request during compatibility phase
- **THEN** VisionOS SHOULD log or expose a diagnostic warning
- **AND** MAY accept the request for backward compatibility

### Requirement: VisionOS inspect exposes refresh diagnostics

VisionOS `SpatialScene` inspect output SHALL expose page generation and object identity fields sufficient to diagnose refresh cleanup behavior.

#### Scenario: Inspect current scene after refresh

- **WHEN** the current scene is inspected after a page refresh
- **THEN** the output SHALL include the current page generation
- **AND** SHALL include spatial object identity information sufficient to identify retained 2D elements
