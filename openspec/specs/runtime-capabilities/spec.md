# Runtime capabilities (WebSpatial SDK)

## Purpose

Provide a documented, synchronous capability-query API (`supports`) and runtime snapshot so applications and the spatial-lazy-load bridge can gate spatial features without trial-and-error across visionOS, PICO, Puppeteer CI harnesses, and plain browsers.
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

The WebSpatial SDK MUST maintain an internal read-only runtime snapshot (for example via an internal `getRuntime()` helper) for capability resolution and for spatial-lazy-load gating. That snapshot MUST NOT be part of the documented application-facing public API. The snapshot retrieval MUST be **synchronous** and MUST be safe to call in environments where `window` is unavailable.

The snapshot MUST contain at minimum:

- `type`: `'visionos' | 'picoos' | 'puppeteer' | null`
- `shellVersion`: `string | null`

The `'puppeteer'` value indicates a Puppeteer-driven test harness UA (matched case-sensitively on the substring `Puppeteer` in `navigator.userAgent`). For purposes of capability resolution and the spatial-lazy-load bridge, `'puppeteer'` MUST be treated as a spatial-runtime equivalent (see the "Detection helper used by lazy-load bridge" Scenario): `supports()` returns `true` for any documented capability key, and `bootSpatial()` MUST schedule a dynamic import of the spatial chunk. This is intentional so end-to-end CI coverage (`packages/autoTest`) exercises the real `import('@webspatial/react-sdk/spatial')` path.

#### Scenario: UA parsing

- **WHEN** UA includes `WSAppShell/<version>`
- **THEN** parser MUST use it as shell version
- **AND** parser MUST NOT map to internal `visionos` unless UA also indicates a Mac-class platform (for example substring `Mac OS X`, case-insensitive)
- **AND** parser SHOULD support `PicoWebApp/<version>` for Pico OS browser-mode runtimes

#### Scenario: Puppeteer runtime detection

- **WHEN** UA contains the substring `Puppeteer` (matching the gate at `packages/core/src/runtime/userAgent.ts:42`)
- **THEN** the snapshot's `type` MUST be `'puppeteer'`
- **AND** this MUST take precedence over `WSAppShell` / `PicoWebApp` token detection so a Puppeteer harness session that also injects `WSAppShell/<version>` (as `packages/autoTest/src/runtime/puppeteerRunner.ts:365` does) is still classified as `'puppeteer'`
- **AND** if the UA also contains a shell-version token, the parsed value MUST be reported on `shellVersion`; otherwise `shellVersion` MAY be `null`

#### Scenario: SSR or no window

- **WHEN** `window` is unavailable (e.g. SSR)
- **THEN** runtime parsing and `supports` checks MUST NOT throw solely for that reason
- **AND** snapshot retrieval MUST return `{ type: null, shellVersion: null }`

#### Scenario: Synchronous read for spatial-lazy-load bridge

- **WHEN** the spatial-lazy-load bridge needs to decide whether to schedule a dynamic import of the spatial chunk
- **THEN** the runtime snapshot MUST be obtainable synchronously without `await`
- **AND** the result MUST be stable across reads in the same page lifetime (consistent with the "Repeated reads" scenario for `supports`)

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

### Requirement: Spatial-dependent capabilities are false in non-WebSpatial browsers

In a non-WebSpatial browser (internal runtime `type === null`) the SDK MUST resolve every documented spatial-dependent capability key to `false`. This applies, but is not limited, to: `Model` and its sub-tokens, `Reality`, `useMetrics`, `convertCoordinate`, `WindowScene`, `VolumeScene`, all Entity / Material / Attachment keys, and any future spatial-dependent key the spec adds. This requirement strengthens existing per-key fallback contracts so that the spatial-lazy-load bridge and facades have a single, consistent gate.

#### Scenario: supports gating for facades

- **WHEN** `supports('Model')` (or any other spatial-dependent key) is called in a non-WebSpatial browser (`type: null`)
- **THEN** the result MUST be `false`
- **AND** the runtime snapshot MUST report `type: null`

#### Scenario: supports in puppeteer harness

- **WHEN** `supports('Model')` (or any other documented capability key) is called in the puppeteer harness (`type: 'puppeteer'`)
- **THEN** the result MUST be `true` (matching the existing `packages/core/src/runtime/supports.ts:84-86` short-circuit)
- **AND** this is intentional: puppeteer bypasses capability gating so the autoTest harness exercises spatial code paths end-to-end without per-capability stubs

#### Scenario: Detection helper used by lazy-load bridge

- **WHEN** the spatial-lazy-load bridge consults the runtime snapshot to decide whether `bootSpatial()` should trigger `import('@webspatial/react-sdk/spatial')`
- **THEN** a non-spatial runtime (snapshot `type === null`) MUST cause the bridge to skip the dynamic import
- **AND** any spatial-equivalent runtime (`'visionos'`, `'picoos'`, OR `'puppeteer'`) MUST cause the bridge to schedule the dynamic import
- **AND** the decision MUST be reachable synchronously without scheduling network requests
