## ADDED Requirements

### Requirement: VisionOS SpatialScene tracks current page generation

VisionOS `SpatialScene` SHALL maintain an authoritative current page generation for refresh-boundary decisions.

#### Scenario: Main page starts loading

- **WHEN** the main page starts a new load cycle
- **THEN** `SpatialScene` SHALL advance its current page generation before cleaning up scene-owned content

### Requirement: VisionOS rejects stale requests by wsepoch

VisionOS request handling SHALL use `wsepoch` as the freshness discriminator when the field is present.

#### Scenario: Request epoch matches current generation

- **GIVEN** a SpatialDiv or attachment request carries `wsepoch=G2`
- **AND** `SpatialScene.currentPageGeneration` is `G2`
- **WHEN** VisionOS handles the request
- **THEN** the request MAY be accepted

#### Scenario: Request epoch is stale

- **GIVEN** a SpatialDiv or attachment request carries `wsepoch=G1`
- **AND** `SpatialScene.currentPageGeneration` is `G2`
- **WHEN** VisionOS handles the request
- **THEN** VisionOS SHALL reject the request as stale
- **AND** SHALL NOT attach the resulting content to the current scene

#### Scenario: Request has no wsepoch in compatibility mode

- **GIVEN** a SpatialDiv or attachment request does not carry `wsepoch`
- **WHEN** VisionOS handles the request during compatibility mode
- **THEN** VisionOS SHALL log a compatibility warning
- **AND** MAY accept the request

### Requirement: VisionOS uses rid only for correlation and diagnostics

VisionOS SHALL treat `rid` as a request-correlation field and SHALL NOT use it as a freshness discriminator.

#### Scenario: Request is logged

- **WHEN** VisionOS logs request acceptance or rejection
- **THEN** the log SHOULD include request `rid`
- **AND** MAY include `wsepoch` for freshness diagnosis

### Requirement: Inspect exposes refresh diagnostics

VisionOS inspect output SHALL expose generation and object identity diagnostics for refresh analysis.

#### Scenario: Inspect after refresh

- **WHEN** the current scene is inspected after refresh
- **THEN** the output SHALL include current page generation
- **AND** SHALL include scene object ids or child ids sufficient to diagnose retained content
