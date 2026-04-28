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
