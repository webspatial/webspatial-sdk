## ADDED Requirements

### Requirement: Manifest scene config resolves supported aliases deterministically
The system MUST accept the supported snake_case and camelCase aliases for `xr_spatial_scene` input fields and MUST resolve them deterministically before runtime defaults are consumed.

#### Scenario: Top-level alias is accepted
- **WHEN** a manifest provides `xr_spatial_scene.default_size` or `xr_spatial_scene.defaultSize`
- **THEN** the system MUST use that value as the source for runtime `defaultSize`

#### Scenario: Same-layer alias conflict prefers snake case
- **WHEN** the same `xr_spatial_scene` object contains both a supported snake_case key and its camelCase alias
- **THEN** the system MUST use the snake_case value for that layer

### Requirement: Scene override selectors accept both alias forms
The system MUST accept both snake_case and camelCase selector names inside `xr_spatial_scene.overrides`.

#### Scenario: Window override alias is accepted
- **WHEN** a manifest provides either `overrides.window_scene` or `overrides.windowScene`
- **THEN** the system MUST apply that object only to window scene defaults

#### Scenario: Volume override alias is accepted
- **WHEN** a manifest provides either `overrides.volume_scene` or `overrides.volumeScene`
- **THEN** the system MUST apply that object only to volume scene defaults

### Requirement: Override precedence remains unchanged
The system MUST preserve the existing precedence order across built-in defaults, top-level manifest values, per-scene overrides, and `initScene()` callback returns.

#### Scenario: Per-scene override beats top-level manifest values
- **WHEN** the top-level `xr_spatial_scene` object defines a field and the matching scene-type override defines the same field
- **THEN** the system MUST use the override value for that scene type

#### Scenario: InitScene callback return beats manifest defaults
- **WHEN** an `initScene()` callback returns a value for a field that was also supplied by manifest defaults
- **THEN** the system MUST use the callback return value for the resolved scene config

### Requirement: Manifest-derived defaults normalize supported resizability aliases
The system MUST normalize supported snake_case resizability keys into the runtime camelCase shape before manifest-derived defaults are exposed to scene initialization code.

#### Scenario: Snake case resizability keys become camel case runtime keys
- **WHEN** a manifest provides `min_width`, `min_height`, `max_width`, or `max_height` inside `resizability`
- **THEN** the manifest-derived runtime defaults MUST expose the corresponding values as `minWidth`, `minHeight`, `maxWidth`, and `maxHeight`

### Requirement: Callback chaining preserves raw callback returns
The system MUST normalize manifest-derived defaults before the first callback, and MUST preserve later callback return values without rewriting their key shape.

#### Scenario: Previous callback return is passed through unchanged
- **WHEN** `initScene()` is called more than once for the same scene name after a callback returned a custom object
- **THEN** the next callback MUST receive that previous return value unchanged