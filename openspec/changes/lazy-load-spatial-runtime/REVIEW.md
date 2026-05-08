# Reviewer guide — `lazy-load-spatial-runtime`

## TL;DR

This **OpenSpec change** replaces the SDK's "dual-build (`dist/web` vs `dist/default`) + alias-switching plugin" architecture with a **runtime lazy-load model**:

- One small default bundle for everyone — **≤ 8KB gzipped marginal delta** added to a typical consumer app (e.g. `import { Model, bootSpatial }`), with `dist/index.js` ≤ 8KB as the SDK-side proxy
- Spatial implementation lives in a separate `@webspatial/react-sdk/spatial` chunk, loaded dynamically via `await bootSpatial()` only inside a WebSpatial runtime
- Plain web users see documented per-component fallbacks (e.g. `Model` → degraded `<model>` tag) without any extra network requests
- `@webspatial/vite-plugin` becomes redundant — the SDK works against any bundler that supports ESM + `exports` + dynamic-import code-splitting

**No source code changes in this PR.** It is documentation only — proposal, design, tasks, and spec under `openspec/changes/lazy-load-spatial-runtime/`.

## What you're reviewing

| Artifact | What it answers |
| --- | --- |
| `proposal.md` | Why this change & high-level "What Changes" |
| `design.md` | How — 13 design decisions, risks, migration plan, open questions |
| `tasks.md` | 14 sections / 80+ implementation tasks |
| `specs/spatial-lazy-load/spec.md` | New capability — 11 normative Requirements + many Scenarios |
| `specs/runtime-capabilities/spec.md` | Delta to existing capability — 1 MODIFIED + 1 ADDED |

`openspec validate lazy-load-spatial-runtime --strict` passes.

## The 11 Requirements at a glance

| # | Requirement | Scenarios | Anchor concern |
| --- | --- | --- | --- |
| 1 | Default entry MUST NOT bundle spatial implementation | 5 | Marginal delta ≤ 8KB on typical consumer (product contract); SDK-side `dist/index.js` ≤ 8KB proxy; worst-case namespace import is informational; symbol absence; complete fallback rendering self-contained in default entry |
| 2 | Spatial implementation MUST live in a dynamically importable subpath | 3 | `import('@webspatial/react-sdk/spatial')`; web never fetches; spatial fetches once |
| 3 | Bridge singleton | 3 | `getSpatialImpl` / `loadSpatialImpl` / SSR safety / load-failure observable |
| 4 | `bootSpatial` is the only activation path | 12 | Single API; idempotent; retry-on-demand; multi-listener `onSpatialLoadError`; `WebSpatialBootError` shape; multi-root sharing; StrictMode safe |
| 5 | Component facades | 8 | Per-component default fallback table (normative); `'use client'`; `displayName`; no `React.memo`; HOC cache identity |
| 6 | Hook placeholders | 7 | Public surface = only `useMetrics` (1/1360 ratio); no mid-life switch; remount picks up real impl |
| 7 | JSX runtime strips spatial markers and wraps with facade HOCs | 8 | Single unified runtime; strip + wrap; `Model` bypass; clone `props.style`; `className` only (not `class`); SSR equivalence |
| 8 | SSR and hydration safety | 7 | Any React 18+ SSR API; `'use client'` on facades; `useSyncExternalStore` for hydration; both boot timings safe |
| 9 | Plugin-free integration | 7 | Capability contract (ESM + `exports` + code-splitting); React peer ≥ 18.0; out-of-scope: Module Federation, Turbopack, Webpack 4, CommonJS |
| 10 | Stateless utility APIs and pure re-exports remain in the default entry | 5 | Group B (session-aware utilities, gracefully degrade via core-sdk) + Group C (pure constants, type re-exports, React Context) live in default entry, are independent of the spatial chunk |
| 11 | Tree-shake friendliness | 5 | `package.json` `"sideEffects": false`; no **observable** top-level side effects (module-private pure init like `forwardRef` / `new Map` / `createContext` explicitly permitted); named re-exports preferred; fixture asserts named-import is materially smaller than namespace import |

Plus an updated `runtime-capabilities` MODIFIED delta: the "Unsupported behavior contracts" Requirement now states hooks/utility functions MUST gracefully degrade (not throw) — replaces the prior contradictory "MUST throw" scenario for `useMetrics` and `convertCoordinate`.

## Public API surface (final, all from `@webspatial/react-sdk`)

```ts
// Boot / state
bootSpatial(): Promise<void>
isSpatialReady(): boolean
useSpatialReady(): boolean    // React hook, useSyncExternalStore-backed
onSpatialLoadError(cb: (err: WebSpatialBootError) => void): () => void
class WebSpatialBootError extends Error { cause: unknown; attempt: number }

// Spatial components (facades) — same TypeScript signatures as before
Model, Reality, BoxEntity, SphereEntity, ConeEntity, CylinderEntity, PlaneEntity,
ModelEntity, AttachmentEntity, UnlitMaterial, Material, Texture, ModelAsset,
AttachmentAsset, SceneGraph

// HOCs (facade wrappers)
withSpatialized2DElementContainer, withSpatialMonitor

// Hooks
useMetrics  // public, with placeholder/real selection per instance

// Existing (unchanged)
WebSpatialRuntime, WebSpatialRuntimeError, CapabilityKey, enableDebugTool,
convertCoordinate, initScene, SSRProvider, getAbsoluteUrl, version
```

### Coverage map (which Requirement covers which API)

| Group | API | Lazy-load treatment | Pinned by |
| --- | --- | --- | --- |
| **A** (lazy-loaded) | `Model`, `Reality`, `*Entity`, materials/assets, `SceneGraph`, HOCs | Facade pattern (default entry) + real impl in spatial chunk | "Component facades" |
| **A** | `useMetrics` | Placeholder + per-instance selector | "Hook placeholders" + `runtime-capabilities` MODIFIED |
| **A** | `createElement` (JSX runtime) | Single unified runtime; strip + facade-HOC wrap | "JSX runtime strips spatial markers and wraps with facade HOCs" |
| **B** (session-aware) | `initScene` | Wraps `core-sdk getSession()`; gracefully degrades | "Stateless utility APIs and pure re-exports" |
| **B** | `convertCoordinate` | Wraps `core-sdk getSession()`; returns input + warn when no session | "Stateless utility APIs" + `runtime-capabilities` MODIFIED |
| **B** | `enableDebugTool` | SSR-safe noop; attaches diagnostics in WebSpatial runtime | "Stateless utility APIs" |
| **C** (pure / type) | `WebSpatialRuntime.supports`, `WebSpatialRuntimeError`, `CapabilityKey`, `SSRProvider`, `getAbsoluteUrl`, `version`, type-only re-exports | Live in default entry; counted toward 8KB size budget; no spatial-chunk dependency | "Stateless utility APIs" |

**Subtle consequence to call out**: in a WebSpatial runtime, an application that **forgets** to call `bootSpatial()` will see Group A facades render fallback (the bridge is not ready) **yet** Group B utilities still work correctly (they go through `core-sdk`'s session detection, independent of the react-sdk bridge). This is intentional — `bootSpatial()` only governs the react-sdk spatial chunk, not the core-sdk session lifecycle.

## Per-component default fallback (normative, from spec)

| Component | Fallback in default entry |
| --- | --- |
| `Model` | `<model ref {...remainingProps} />` (spatial event props stripped) |
| `Reality` | `<div aria-hidden="true" ref>` placeholder; children NOT mounted |
| `*Entity` family, `UnlitMaterial`, `Material`, `Texture`, `ModelAsset`, `AttachmentAsset` | `null` |
| `SceneGraph` / `World` | `<>{children}</>` (transparent) |
| HOC wrappers | `<Comp/El {...passthrough} ref />` (transparent passthrough) |

## Bundler compatibility matrix

| | Status |
| --- | --- |
| Vite ≥ 4, Webpack ≥ 5, Rollup ≥ 3, Rspack ≥ 1, esbuild ≥ 0.18 (`splitting: true`) | ✅ Tested target |
| Next.js App Router (Webpack mode), Pages Router | ✅ Canonical framework target |
| Module Federation, Next.js Turbopack, Webpack 4, CommonJS-only | ⚠️ Out of scope for v1 (may work, no contract) |
| ESM consumption, React ≥ 18.0 | ❌ Required (CJS unsupported; React < 18 unmet peer dep) |

## Runtime classification matrix

How the bridge / facades / `supports()` behave per `runtime-capabilities` snapshot `type`:

| `type` | UA gate | `bootSpatial()` behavior | `supports()` behavior | Facade renders |
| --- | --- | --- | --- | --- |
| `'visionos'` | `WSAppShell/<v>` + `Mac OS X` | Loads `@webspatial/react-sdk/spatial` via dynamic import | Per `core-sdk` capability table at the matched shell version | Real spatial after boot resolves |
| `'picoos'` | `PicoWebApp/<v>` or `PicoBrowser` | Same as `'visionos'` | Same | Same |
| `'puppeteer'` | UA contains `Puppeteer` (precedence over `WSAppShell`) | Same as `'visionos'` (so autoTest exercises the chunk-fetch path) | `true` for any documented capability key | Real spatial after boot resolves |
| `null` | Plain browser / SSR / any other UA | No-op (resolves immediately) | `false` for spatial-dependent keys | Documented per-component fallback |

## Decisions to ratify (BREAKING items)

Reviewers, please confirm or push back on these BREAKING decisions:

- [ ] **Hard-cut `@webspatial/react-sdk/web` and `@webspatial/react-sdk/default` subpaths** (no transition window). Old `@webspatial/vite-plugin` aliases will fail to resolve.
- [ ] **`bootSpatial()` is the single activation path.** No `<SpatialBoundary>` / Suspense ergonomics in v1.
- [ ] **Per-facade `props.fallback` is intentionally NOT a v1 API.** Customization via user-side `useSpatialReady()` wrappers.
- [ ] **`@webspatial/vite-plugin` retired** in a follow-up cross-repo issue (not blocking this PR).
- [ ] **In-house apps (`apps/test-server`, `packages/autoTest`, `tests/ci-test`) are NOT migrated** in this change; tracked as follow-up tasks in §12.
- [ ] **8KB gzip size budget framed as marginal delta on a typical consumer** (`import { Model, bootSpatial }` usage) — the user-facing product contract. The SDK-side `dist/index.js` ≤ 8KB is a proxy. Worst-case namespace imports MAY exceed; documented as informational. Calibration follow-up (`tasks.md §12.9`) tightens or files optimization issues against measured reality before v1.
- [ ] **`"sideEffects": false`** declaration on the published `package.json` plus removal of all top-level side effects (notably the existing `if (typeof window) initPolyfill()`) is required to make tree-shaking actually achieve the marginal-delta budget. Pinned by the new "Tree-shake friendliness" Requirement.
- [ ] **`'use client'` directive** required on every facade and every public hook file (RSC compatibility).
- [ ] **Stateless utility APIs (Group B / C)** stay in the default entry and are NOT lazy-loaded. Group B (`initScene`, `convertCoordinate`, `enableDebugTool`) gracefully degrades via `core-sdk` session detection without `bootSpatial()`. The `runtime-capabilities` "Unsupported behavior contracts" Requirement is MODIFIED so hooks/utility APIs gracefully degrade rather than throw — resolving a prior pre-existing contradiction with the actual implementation.
- [ ] **API surface triage** (pre-implementation): four internal containers / monitors (`SpatializedContainer`, `Spatialized2DElementContainer`, `SpatializedStatic3DElementContainer`, `SpatialMonitor`) are BREAKING-removed from the default entry — the supported usage is the HOCs `withSpatialized2DElementContainer` / `withSpatialMonitor`. `Entity` (the base entity class) is retained as a public facade. `createElement` is `@deprecated` in v1 with v2 removal scheduled; in-tree consumers verified zero (no apps/packages/tests import it).
- [ ] **Puppeteer is a first-class spatial-equivalent runtime in v1.** The `runtime-capabilities` snapshot type `'puppeteer'` (already produced by `core-sdk`'s UA parser since runtime-feature-detection landed) is now explicitly recognized by the lazy-load bridge: `bootSpatial()` schedules a real `import('@webspatial/react-sdk/spatial')` in puppeteer mode, so `packages/autoTest` exercises the chunk-fetch path end-to-end. Alternatives considered and rejected: (B) bridge no-op + test-only `__internalSetSpatialImpl` hook; (C) v1 keeps puppeteer out of the spec.

## Open questions for reviewer input

(Tracked in `design.md` Open Questions; revisit after the first measurement / user-feedback wave)

- Final number for the gzip size budget (target 8KB marginal-delta on typical consumer; calibrate against real measurements during implementation per `tasks.md §12.9`)
- Whether to expose `getBootStatus()` for finer state (v1 says no)
- Whether `bootSpatial({ timeoutMs })` should be a v1 option (v1 says no)
- Cadence for tightening size budget after release

## Recommended review path

1. Skim **`proposal.md`** (~50 lines) for "Why" and "What Changes" first.
2. Read **`spec.md`** Requirements 4 → 5 → 6 → 7 → 8 → 9 in that order — these are where the contract gets specific. Requirements 1, 2, 3 are short and sit above; Requirement 11 (Tree-shake friendliness) is a small but normative addition behind Requirement 1.
3. Skim **`design.md`** decisions 1–13 — each decision points back at the relevant spec Requirement. Decision 13 (Size budget framing) explains the marginal-delta vs proxy split.
4. Skim **`tasks.md`** §1–§14 to gauge implementation scope. §9 is size-budget enforcement (proxy + marginal-delta fixture + sideEffects + tree-shake check), §12.9 is the pre-v1 budget calibration follow-up, §13 is SSR validation, §14 is stateless-utility validation.
5. Optionally read **`specs/runtime-capabilities/spec.md`** delta if you maintain `runtime-capabilities`.

## Validate locally

```bash
openspec validate lazy-load-spatial-runtime --strict
openspec status --change lazy-load-spatial-runtime
openspec show lazy-load-spatial-runtime           # interactive view
```

## Commit history

The PR was incrementally refined through multiple design-decision passes plus consistency reviews. Each commit message documents a self-contained refinement; `git log --oneline` is a usable secondary index if you want to read the spec's evolution.

---

**No source code is touched in this PR.** Implementation will follow in subsequent PRs aligned with `tasks.md`. The recommended split is `§1 + §2` as a foundation PR, `§3 + §4 + §5 + §6 + §7` as the core feature PR, and `§8 + §9 + §10 + §13 + §14` as the build / size budget / SSR validation / stateless-utility validation / docs PR. `§11 / §12` are non-blocking follow-ups.
