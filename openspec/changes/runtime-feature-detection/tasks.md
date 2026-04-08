See **[`review.md`](./review.md#review-contents)** (table of contents) for the full design checklist.

## 1. Spec and types

- [ ] 1.1 Align `specs/runtime-capabilities/spec.md` with external `supports` contract and internal `getRuntime` notes
- [ ] 1.2 Define TypeScript types: supports name unions / sub-token maps per feature group; internal runtime type `'visionos' | 'picoos' | null`

## 2. Capability data and resolution (core)

- [ ] 2.1 Implement internal **`getRuntime()`**: `type` + `shellVersion` from UA
- [ ] 2.2 UA parsing: prefer `WSAppShell/<version>`, keep temporary `PicoWebApp/<version>` compatibility
- [ ] 2.3 Implement **versioned capability table** (per `review.md` §3–§4): semver compare, fallback row, **false** when below min or unparseable
- [ ] 2.4 Implement **`supports(name, tokens?)`**: unknown `name`/token → **false**; **AND** for sub-tokens; **`supports(name, [])` ≡ `supports(name)`**
- [ ] 2.5 SSR / no-window: documented defaults, no throw

## 3. React SDK

- [ ] 3.1 Export **`WebSpatialRuntime.supports`** from **`@webspatial/react-sdk`** (do not expose `getRuntime`)
- [ ] 3.2 DOM depth support keys: `xrClientDepth`, `xrOffsetBack`, `xrInnerDepth`, `xrOuterDepth`; unsupported reads should be `undefined`
- [ ] 3.3 Model unsupported JS members should be absent (`in === false`, read `undefined`, no noop methods)

## 4. Tests and docs

- [ ] 4.1 Unit tests: resolution rules (mock UA), `supports` shape, unknown keys/tokens
- [ ] 4.2 JS API behavior: unsupported `useMetrics` / `convertCoordinate` throw `WebSpatialRuntimeError`
- [ ] 4.3 Scene keys and sub-tokens: `WindowScene`, `VolumeScene`, `defaultSize`, `resizability`, `worldScaling`, `worldAlignment`, `baseplateVisibility`
- [ ] 4.4 Model sub-token tests (`autoplay`, `loop`, `stagemode`, `poster`, `loading`, `source`) and model JS API token checks
- [ ] 4.5 Public API doc (keys, sub-tokens, fallback semantics) + link to **`review.md`**

## 5. Follow-ups (non-blocking)

- [ ] 5.1 Runtime-provided capability manifest proposal (schema + precedence over shell-inference)
