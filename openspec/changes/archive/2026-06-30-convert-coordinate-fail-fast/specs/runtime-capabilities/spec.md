## MODIFIED Requirements

### Requirement: Unsupported behavior contracts

For APIs documented as runtime-gated, unsupported calls/reads MUST follow documented fallback behavior.

#### Scenario: `useMetrics` hook call does not throw

- **WHEN** `supports('useMetrics')` is `false`
- **THEN** calling `useMetrics()` MUST NOT throw
- **AND** the returned object MUST expose stable `pointToPhysical` / `physicalToPoint` function references
- **AND** invoking either conversion function while the placeholder is active MUST throw `WebSpatialRuntimeError` with capability `'useMetrics'`

#### Scenario: `convertCoordinate` fail-fast when capability unsupported

- **WHEN** `supports('convertCoordinate')` is `false` (non-WebSpatial browser, SSR, or no detectable WebSpatial runtime)
- **THEN** calling `convertCoordinate(position, { from, to })` MUST throw `WebSpatialRuntimeError` with capability `'convertCoordinate'`
- **AND** the call MUST NOT resolve with `position` unchanged

#### Scenario: `convertCoordinate` fail-fast without spatial session

- **WHEN** `supports('convertCoordinate')` is `true` but no `SpatialSession` or `SpatialScene` is reachable through the React SDK bridge (for example before `bootSpatial()` resolves)
- **THEN** calling `convertCoordinate(position, { from, to })` MUST throw `WebSpatialRuntimeError` with capability `'convertCoordinate'`
- **AND** the error message MUST indicate that `bootSpatial()` must be awaited first

#### Scenario: `convertCoordinate` fail-fast on invalid refs

- **WHEN** `from` or `to` is not a valid coordinate convertible (`Window`, `SpatializedElementRef`, `EntityRef`, or `ModelRef`)
- **THEN** calling `convertCoordinate(position, { from, to })` MUST throw `WebSpatialRuntimeError` with capability `'convertCoordinate'`
- **AND** the error message MUST identify the invalid `from` / `to` argument

#### Scenario: Unsupported HTML component rendering

- **WHEN** a non-Model, non-`Reality` HTML capability key resolves to `false` (including `Material`, `AttachmentAsset` / `AttachmentEntity`, and other component keys not covered by dedicated scenarios)
- **THEN** SDK fallback MUST not render corresponding DOM/entity node and MUST not execute dependent runtime side effects

#### Scenario: `Reality` unsupported fallback

- **WHEN** `supports('Reality')` is `false`
- **THEN** SDK MUST NOT create or attach the spatialized Reality root entity and MUST NOT execute dependent runtime side effects
- **AND** SDK MUST render exactly one host placeholder `div` that preserves the layout box (layout-affecting props such as `className`, `style`, and other attributes that participate in CSS layout MUST apply to that host so authored layout is preserved)
- **AND** that placeholder MUST be visually hidden from users
- **AND** that placeholder MUST NOT participate in keyboard focus (for example it MUST NOT be focusable and MUST NOT use a positive `tabIndex`)
- **AND** that placeholder MUST be excluded from the accessibility tree (for example `aria-hidden="true"`)
- **AND** `Reality` MUST NOT render its React child subtree (no `children` mount)

#### Scenario: `Model` exception fallback

- **WHEN** `supports('Model')` is `false`
- **THEN** fallback MUST render native `<model>` with props passthrough

#### Scenario: Unsupported model JS members

- **WHEN** a model JS sub-capability resolves to `false`
- **THEN** corresponding member on simulated model element MUST be absent (`in` check false, property read `undefined`)
