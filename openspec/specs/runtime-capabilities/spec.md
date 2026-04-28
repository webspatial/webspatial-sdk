# Runtime capabilities (WebSpatial SDK)

## Requirements

### Requirement: Expose capability queries via `supports`

The WebSpatial SDK MUST provide a documented **`supports(name, tokens?)`** function that returns **`boolean`**, indicating whether the current runtime supports the named capability, optionally constrained by predefined sub-tokens.

#### Scenario: Unknown top-level name

- **WHEN** `name` is not a documented capability key
- **THEN** the result MUST be **`false`**

#### Scenario: Unknown or invalid sub-token

- **WHEN** `tokens` contains a string not in the documented list for that `name`
- **THEN** the result MUST be **`false`**

#### Scenario: Sub-token AND semantics

- **WHEN** `tokens` is a non-empty array of documented sub-tokens
- **THEN** the result MUST be **`true`** only if **every** listed sub-capability is supported (**AND**)

#### Scenario: Empty tokens

- **WHEN** `tokens` is an empty array
- **THEN** behavior MUST match **omitting** `tokens` (top-level check only)

#### Scenario: Non-WebSpatial runtime

- **WHEN** runtime is not WebSpatial (internal runtime type is `null`)
- **THEN** **`supports`** MUST return **`false`** for Spatial-dependent keys as defined per key

---

### Requirement: Documented capability keys

The SDK MUST maintain **public documentation** listing every top-level **`name`**, optional **sub-tokens**, human-readable meaning, and when the value is **`false`** (including conservative cases).

#### Scenario: Forward compatibility for new keys

- **WHEN** a future SDK version adds new capability keys or sub-tokens
- **THEN** older applications that only check known keys MUST continue to behave as before
- **AND** unknown keys MUST still yield **`false`** for older SDKs that do not define them (or as documented for that SDK version)

---

### Requirement: Internal runtime snapshot

The WebSpatial SDK MUST maintain an internal read-only runtime snapshot (for example via an internal `getRuntime()` helper) for capability resolution. That snapshot MUST NOT be part of the documented application-facing public API.

The snapshot MUST contain at minimum:

- `type`: `'visionos' | 'picoos' | null`
- `shellVersion`: `string | null`

#### Scenario: UA parsing

- **WHEN** UA includes `WSAppShell/<version>`
- **THEN** parser MUST use it as shell version
- **AND** parser MUST NOT map to internal `visionos` unless UA also indicates a Mac-class platform (for example substring `Mac OS X`, case-insensitive)
- **AND** parser SHOULD support `PicoWebApp/<version>` for Pico OS browser-mode runtimes

#### Scenario: SSR or no window

- **WHEN** `window` is unavailable (e.g. SSR)
- **THEN** runtime parsing and `supports` checks MUST NOT throw solely for that reason

---

### Requirement: Discoverability without undocumented globals

The capability API MUST be usable without undocumented globals; supported app entry point is exported `WebSpatialRuntime.supports`.

#### Scenario: Repeated reads

- **WHEN** application code calls **`supports`** multiple times
- **THEN** successive reads MUST return **consistent** results for the same runtime state
- **AND** v1 treats capabilities as **stable** for the page/session once runtime is determined (no subscribe / mid-session capability refresh API)

---

### Requirement: Unsupported behavior contracts

For APIs documented as runtime-gated, unsupported calls/reads MUST follow documented fallback behavior.

#### Scenario: `useMetrics` and `convertCoordinate`

- **WHEN** `supports('useMetrics')` or `supports('convertCoordinate')` is `false`
- **THEN** calling corresponding API MUST throw `WebSpatialRuntimeError`

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
