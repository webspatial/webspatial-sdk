# Runtime capabilities (WebSpatial SDK) — delta

## MODIFIED Requirements

### Requirement: Internal runtime snapshot

The WebSpatial SDK MUST maintain an internal read-only runtime snapshot (for example via an internal `getRuntime()` helper) for capability resolution and for spatial-lazy-load gating. That snapshot MUST NOT be part of the documented application-facing public API. The snapshot retrieval MUST be **synchronous** and MUST be safe to call in environments where `window` is unavailable.

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
- **AND** snapshot retrieval MUST return `{ type: null, shellVersion: null }`

#### Scenario: Synchronous read for spatial-lazy-load bridge

- **WHEN** the spatial-lazy-load bridge needs to decide whether to schedule a dynamic import of the spatial chunk
- **THEN** the runtime snapshot MUST be obtainable synchronously without `await`
- **AND** the result MUST be stable across reads in the same page lifetime (consistent with the "Repeated reads" scenario for `supports`)

### Requirement: Unsupported behavior contracts

For APIs documented as runtime-gated, unsupported calls/reads MUST follow documented fallback behavior. The fallback pattern depends on the API kind:

- **Hooks and utility functions** MUST gracefully degrade — return safe documented default values (optionally with a one-shot `console.warn` for diagnostic value), but MUST NOT throw.
- **Components** MUST render their per-component fallback (see the `spatial-lazy-load` spec's "Component facades" Requirement for the lazy-load era; the per-component scenarios below additionally pin `Reality` and `Model`).
- **Object members** MAY be absent (`in === false`, property read `undefined`).

#### Scenario: `useMetrics` graceful degradation

- **WHEN** `supports('useMetrics')` is `false`
- **THEN** calling `useMetrics()` MUST NOT throw
- **AND** the returned object MUST match the `spatial-lazy-load` spec's "Hook placeholders" Requirement: `pointToPhysical(pt) === pt / 1360` and `physicalToPoint(m) === m * 1360` with stable function identities

#### Scenario: `convertCoordinate` graceful degradation

- **WHEN** `supports('convertCoordinate')` is `false`, or no `SpatialSession` is available, or no `SpatialScene` is reachable from the input refs
- **THEN** calling `convertCoordinate(position, { from, to })` MUST resolve with `position` unchanged
- **AND** the SDK MAY emit a one-shot `console.warn` with diagnostic context
- **AND** the call MUST NOT throw

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

## ADDED Requirements

### Requirement: Spatial-dependent capabilities are false in non-WebSpatial browsers

In a non-WebSpatial browser (internal runtime `type === null`) the SDK MUST resolve every documented spatial-dependent capability key to `false`. This applies, but is not limited, to: `Model` and its sub-tokens, `Reality`, `useMetrics`, `convertCoordinate`, `WindowScene`, `VolumeScene`, all Entity / Material / Attachment keys, and any future spatial-dependent key the spec adds. This requirement strengthens existing per-key fallback contracts so that the spatial-lazy-load bridge and facades have a single, consistent gate.

#### Scenario: supports gating for facades

- **WHEN** `supports('Model')` (or any other spatial-dependent key) is called in a non-WebSpatial browser
- **THEN** the result MUST be `false`
- **AND** the runtime snapshot MUST report `type: null`

#### Scenario: Detection helper used by lazy-load bridge

- **WHEN** the spatial-lazy-load bridge consults the runtime snapshot to decide whether `bootSpatial()` should trigger `import('@webspatial/react-sdk/spatial')`
- **THEN** a non-WebSpatial browser MUST cause the bridge to skip the dynamic import
- **AND** the decision MUST be reachable synchronously without scheduling network requests
