See **[`review.md`](./review.md#review-contents)** (table of contents) for the full design checklist.

## 1. Spec and types

- [x] 1.1 Align `specs/runtime-capabilities/spec.md` with external `supports` contract and internal `getRuntime` notes
- [x] 1.2 Define TypeScript types: supports name unions / sub-token maps per feature group; internal runtime type `'visionos' | 'picoos' | null`

## 2. Capability data and resolution (core)

- [x] 2.1 Implement internal **`getRuntime()`**: `type` + `shellVersion` from UA
- [x] 2.2 UA parsing: support packaged-runtime `WSAppShell/<version>` and Pico browser-mode `PicoWebApp/<version>` (prefer `WSAppShell` when both appear)
- [x] 2.3 Implement **versioned capability table** (per `review.md` §3–§4): semver compare, fallback row, **false** when below min or unparseable
- [x] 2.4 Implement **`supports(name, tokens?)`**: unknown `name`/token → **false**; **AND** for sub-tokens; **`supports(name, [])` ≡ `supports(name)`**
- [x] 2.5 SSR / no-window: documented defaults, no throw

## 3. React SDK

- [x] 3.1 Export **`WebSpatialRuntime.supports`** from **`@webspatial/react-sdk`** (do not expose `getRuntime`)
- [x] 3.2 DOM depth keys: `xrInnerDepth`/`xrOuterDepth` on `window`; `xrClientDepth`/`xrOffsetBack` on spatialized `ref` (not `window`) — see `review.md` §3.5
- [x] 3.3 Model unsupported JS members should be absent (`in === false`, read `undefined`, no noop methods)

## 4. Tests and docs

- [x] 4.1 Unit tests: resolution rules (mock UA), `supports` shape, unknown keys/tokens
- [x] 4.2 JS API behavior: unsupported `useMetrics` / `convertCoordinate` throw `WebSpatialRuntimeError`
- [x] 4.3 Scene / init API keys: `initScene` (top-level, no sub-tokens); `WindowScene`, `VolumeScene` and sub-tokens `defaultSize`, `resizability`, `worldScaling`, `worldAlignment`, `baseplateVisibility`
- [x] 4.4 Model sub-token tests (`autoplay`, `loop`, `stagemode`, `poster`, `loading`, `source`) and model JS API token checks
- [x] 4.5 Public API doc (keys, sub-tokens, fallback semantics) + link to **`review.md`**

## 5. Follow-ups (non-blocking)

- [x] 5.1 Runtime-provided capability manifest proposal (schema + precedence over shell-inference)
