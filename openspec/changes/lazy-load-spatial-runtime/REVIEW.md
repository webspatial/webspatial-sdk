# Reviewer guide — `lazy-load-spatial-runtime`

## TL;DR

This **OpenSpec change** replaces the SDK's "dual-build (`dist/web` vs `dist/default`) + alias-switching plugin" architecture with a **runtime lazy-load model**:

- One small default bundle for everyone — **≤ 8KB gzipped marginal delta** added to a typical consumer app (e.g. `import { Model, bootSpatial }`), with `dist/index.js` ≤ 8KB as the SDK-side proxy
- Spatial implementation lives in a separate `@webspatial/react-sdk/spatial` chunk, loaded dynamically via `await bootSpatial()` only inside a WebSpatial runtime
- Spatial-only consumers can opt into `@webspatial/react-sdk/eager`, a single-request entry that statically links the spatial implementation and exposes no-op boot compatibility stubs
- Plain web users see documented per-component fallbacks (e.g. `Model` → degraded `<model>` tag) without any extra network requests
- `@webspatial/vite-plugin` becomes redundant — the SDK works against any bundler that supports ESM + `exports` + dynamic-import code-splitting

This guide originally accompanied the spec-only proposal. The active branch now includes implementation commits as well; use `tasks.md` as the source of truth for which implementation slices are complete and which follow-ups remain.

## What you're reviewing

| Artifact | What it answers |
| --- | --- |
| `proposal.md` | Why this change & high-level "What Changes" |
| `design.md` | How — 14 design decisions, risks, migration plan, open questions |
| `tasks.md` | 16 sections / 109 implementation and follow-up tasks |
| `specs/spatial-lazy-load/spec.md` | New capability — 13 normative Requirements + many Scenarios |
| `specs/runtime-capabilities/spec.md` | Delta to existing capability — 2 MODIFIED + 1 ADDED |

`openspec validate lazy-load-spatial-runtime --strict` passes.

## The 13 Requirements at a glance

| # | Requirement | Scenarios | Anchor concern |
| --- | --- | --- | --- |
| 1 | Default entry MUST NOT bundle spatial implementation | 5 | Marginal delta ≤ 8KB on typical consumer (product contract); SDK-side `dist/index.js` ≤ 8KB proxy; worst-case namespace import is informational; symbol absence; complete fallback rendering self-contained in default entry |
| 2 | Spatial implementation MUST live in a dynamically importable subpath | 3 | `import('@webspatial/react-sdk/spatial')`; web never fetches; spatial fetches once |
| 3 | Bridge singleton | 3 | `getSpatialImpl` / `loadSpatialImpl` / SSR safety / load-failure observable |
| 4 | `bootSpatial` is the only activation path | 13 | Single API; idempotent; retry-on-demand; multi-listener `onSpatialLoadError`; `WebSpatialBootError` shape; multi-root sharing; StrictMode safe; dev-mode warning differential (warn in WebSpatial when boot forgotten; silent in plain web) |
| 5 | Component facades | 8 | Per-component default fallback table (normative); `'use client'`; `displayName`; no `React.memo`; HOC cache identity |
| 6 | Hook placeholders | 7 | Public surface = only `useMetrics` (1/1360 ratio); no mid-life switch; remount picks up real impl |
| 7 | JSX runtime strips spatial markers and wraps with facade HOCs | 8 | Single unified runtime; strip + wrap when callable; RSC Client Reference strip-only caveat; `Model` bypass; clone `props.style`; `className` only (not `class`); SSR-safe output |
| 8 | SSR and hydration safety | 7 | Any React 18+ SSR API; `'use client'` on facades; `useSyncExternalStore` for hydration; both boot timings safe |
| 9 | Plugin-free integration | 11 | Capability contract (ESM + `exports` + code-splitting); React **hard peer** ≥ 18.0 (`optional: false`); React-less use NOT a v1 contract; bundler-without-splitting still functions; legacy `/web` `/default` subpaths removed; spatial container internals removal; `createElement` deprecation; out-of-scope: Module Federation, Turbopack, Webpack 4, CommonJS |
| 10 | Stateless utility APIs and pure re-exports remain in the default entry | 5 | Group B (session-aware utilities, gracefully degrade via core-sdk) + Group C (pure constants, type re-exports, React Context) live in default entry, are independent of the spatial chunk |
| 11 | Tree-shake friendliness | 5 | `package.json` `"sideEffects": false`; no **observable** top-level side effects (module-private pure init like `forwardRef` / `new Map` / `createContext` explicitly permitted); named re-exports preferred; fixture asserts named-import is materially smaller than namespace import |
| 12 | Eager-mode entry for spatial-only consumers | 9 | `@webspatial/react-sdk/eager`; statically linked spatial implementation; no-op `bootSpatial`; readiness always true; own 30KB proxy budget; import-root-only migration; mixed imports unsupported |
| 13 | Two distribution forms share packaging hygiene | 2 | Lazy and eager entries both retain ESM-only, hard React peers, tree-shake hygiene, type-only erasure, plugin-free integration, SSR/RSC safety, and shared stateless utilities |

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
Model, Reality, Entity, BoxEntity, SphereEntity, ConeEntity, CylinderEntity,
PlaneEntity, ModelEntity, AttachmentEntity, UnlitMaterial, Material, Texture,
ModelAsset, AttachmentAsset, SceneGraph, World

// HOCs (facade wrappers)
// `withSpatialized2DElementContainer` / `withSpatialMonitor` were originally
// on this list as factory-style public HOCs; both were demoted to
// internal-only — see the `internalize-hoc-factories` changeset.

// Hooks
useMetrics  // public, with placeholder/real selection per instance

// Existing (unchanged)
WebSpatialRuntime, WebSpatialRuntimeError, CapabilityKey, enableDebugTool,
convertCoordinate, initScene, version
// (`SSRProvider` was originally on this listing; removed from public exports —
//  see the `remove-ssr-provider` changeset.)
// (`getAbsoluteUrl` was originally on this listing; demoted to an internal
//  helper at `src/internal/urlUtils.ts` — see the `remove-getabsoluteurl`
//  changeset.)

// Deprecated in v1, removal planned for v2
createElement

// Removed from default entry
SpatializedContainer, Spatialized2DElementContainer,
SpatializedStatic3DElementContainer, SpatialMonitor
```

### Coverage map (which Requirement covers which API)

| Group | API | Lazy-load treatment | Pinned by |
| --- | --- | --- | --- |
| **A** (lazy-loaded) | `Model`, `Reality`, `*Entity`, materials/assets, `SceneGraph`, JSX-marker internal HOC wrappers | Facade pattern (default entry) + real impl in spatial chunk | "Component facades" |
| **A** | `useMetrics` | Placeholder + per-instance selector | "Hook placeholders" + `runtime-capabilities` MODIFIED |
| **A** | `createElement` (JSX runtime) | Single unified runtime; strip + facade-HOC wrap | "JSX runtime strips spatial markers and wraps with facade HOCs" |
| **B** (bridge-session-aware) | `initScene` | Reads the bridge session after `bootSpatial()`; gracefully degrades | "Stateless utility APIs and pure re-exports" |
| **B** | `convertCoordinate` | Reads the bridge session after `bootSpatial()`; returns input + warn when no session | "Stateless utility APIs" + `runtime-capabilities` MODIFIED |
| **B** | `enableDebugTool` | SSR-safe noop; attaches diagnostics in WebSpatial runtime | "Stateless utility APIs" |
| **C** (pure / type) | `WebSpatialRuntime.supports`, `WebSpatialRuntimeError`, `CapabilityKey`, `version`, type-only re-exports (`SSRProvider` was originally on this row but has since been removed — see `remove-ssr-provider`; `getAbsoluteUrl` was originally on this row but has since been demoted to an internal helper — see the `remove-getabsoluteurl` changeset) | Live in default entry; counted toward 8KB size budget; no spatial-chunk dependency | "Stateless utility APIs" |

**Subtle consequence to call out**: in a WebSpatial runtime, an application that **forgets** to call `bootSpatial()` will see Group A facades render fallback and Group B utilities gracefully degrade because both read from the same unready bridge. This keeps `bootSpatial()` as the single activation path and keeps the emitted default-entry closure free of core-sdk runtime imports.

## Per-component default fallback (normative, from spec)

| Component | Fallback in default entry |
| --- | --- |
| `Model` | `<model ref {...remainingProps} />` (spatial event props stripped) |
| `Reality` | `<div aria-hidden="true" ref>` placeholder; children NOT mounted |
| `Entity`, `*Entity` family, `UnlitMaterial`, `Material`, `Texture`, `ModelAsset`, `AttachmentAsset` | `null` |
| `SceneGraph` / `World` alias | `null` (children NOT mounted) |
| Internal HOC wrappers (JSX runtime only) | `<Comp/El {...passthrough} ref />` (transparent passthrough) |

## Two-scenario behavior contract audit

After lazy-load, every Group A public API has **TWO independent unsupported-behavior code paths**:

- **Path 1 — boot-bundle facade fallback** (lives in default entry): exercised when `isSpatialReady() === false` for any reason — non-WebSpatial browser, SSR, boot in flight, boot rejected, boot never called. Pinned by `spec.md` "Component facades" / "Hook placeholders".
- **Path 2 — spatial-chunk real-impl unsupported fallback** (lives in `@webspatial/react-sdk/spatial`): exercised when `bootSpatial()` HAS resolved AND the real implementation is mounted, but the underlying capability check returns `false` (e.g. shell version too old). Pinned by `runtime-capabilities` "Unsupported behavior contracts".

The two paths are physically separate code (boot bundle vs spatial chunk) and **MUST produce structurally identical observable behavior** unless explicitly differentiated (only `console.warn` policy differs — Path 1 silent, Path 2 MAY warn). This audit table is the reviewer's checklist:

| API | Path 1 fallback (Scenario 1) | Path 1 pinned by | Path 2 fallback (Scenario 2) | Path 2 pinned by | Status |
| --- | --- | --- | --- | --- | --- |
| `Model` | `<model ref {...rest}/>` (spatial event props stripped) | `spatial-lazy-load` "Model fallback renders degraded `<model>` tag" | Same — native `<model>` with props passthrough | `runtime-capabilities` "`Model` exception fallback" | ✅ Aligned |
| `Reality` | `<div aria-hidden="true" ref>`, children NOT mounted | `spatial-lazy-load` "Reality fallback preserves layout" | Same — `<div aria-hidden>` placeholder, layout preserved, no child mount | `runtime-capabilities` "`Reality` unsupported fallback" | ✅ Aligned |
| `Entity` / `*Entity` family | `null` | `spatial-lazy-load` "Component facades" + facade table | "MUST NOT render corresponding DOM/entity node" — implies `null` | `runtime-capabilities` "Unsupported HTML component rendering" | ✅ Aligned |
| `UnlitMaterial` / `Material` / `Texture` / `*Asset` | `null` | facade table | Same (entity-rendering contract above) | `runtime-capabilities` "Unsupported HTML component rendering" | ✅ Aligned |
| `SceneGraph` / `World` | `null` (children NOT mounted) | facade table | **Not explicitly pinned** today | — | ⚠️ Gap — `tasks.md §15.3` parity test asserts alignment; v1.x amendment opens a `runtime-capabilities` Scenario |
| `withSpatialized2DElementContainer(Comp)` / `withSpatialMonitor(El)` | — | — | — | — | n/a — both factories were demoted to **internal-only** in the `internalize-hoc-factories` change. The §15.8 parity gap they represented is dissolved (the SDK no longer commits to a documented Path 2 contract for them). The JSX-runtime-driven wrap path remains tested by `jsx-shared.test.tsx`. |
| `useMetrics` | 1/1360 ratio + identity-stable functions | `spatial-lazy-load` "Hook placeholders" + "useMetrics placeholder returns the documented fallback values" | Identical 1/1360 ratio; MAY emit one-shot `console.warn` | `runtime-capabilities` "`useMetrics` graceful degradation" | ✅ Aligned |
| `initScene` / `convertCoordinate` / `enableDebugTool` | Group B utilities — Path 1 gracefully degrades until the bridge has a session; Path 2 routes through the loaded spatial impl session | `spatial-lazy-load` "Stateless utility APIs..." Requirement | Same fallback shape | `runtime-capabilities` "`convertCoordinate` graceful degradation" + Group B contracts | ✅ Aligned |
| `WebSpatialRuntime.supports`, `version`, `WebSpatialRuntimeError`, `CapabilityKey` (note: `SSRProvider` originally listed here, removed — see `remove-ssr-provider`; `getAbsoluteUrl` originally listed here, removed from public surface — see the `remove-getabsoluteurl` changeset) | Group C — no feature-gating concept; not a "two-scenario" API | `spatial-lazy-load` "Stateless utility APIs..." Requirement | (n/a — pure data / re-exports) | — | n/a |
| `bootSpatial`, `isSpatialReady`, `useSpatialReady`, `onSpatialLoadError`, `WebSpatialBootError`, `createElement` | Infrastructure — not "feature-gated" APIs | (n/a) | (n/a) | — | n/a |

**Why the audit matters**: Path 1 and Path 2 are written by different commits, in different files, in different bundles. Without parity tests, a future facade tweak (e.g. changing `Reality`'s placeholder from `<div>` to `<span>`) can silently leave the real-impl unsupported branch in the spatial chunk emitting a different DOM. `tasks.md §15` adds a parametrized parity-test harness that mounts each facade in both contexts and asserts the rendered HTML is structurally identical — caught at unit-test time, not in production.

**Console-warning policy differential** (intentional difference between Path 1 and Path 2): non-WebSpatial Path 1 MUST NOT emit `console.warn` for boot-was-forgotten or capability-unsupported (the user's plain browser is the intended environment; warnings are noise). WebSpatial-runtime Path 2 MAY emit one-shot `console.warn` per page per affected API. Pinned by `spec.md` "No dev-mode warning in non-WebSpatial browsers" Scenario plus `runtime-capabilities` "`useMetrics` graceful degradation" Scenario; verified by `tasks.md §15.5`.

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
- [ ] **Stateless utility APIs (Group B / C)** stay in the default entry and are NOT lazy-loaded. Group B (`initScene`, `convertCoordinate`, `enableDebugTool`) gracefully degrades before `bootSpatial()` and reads the bridge session after the spatial chunk loads. The default entry MUST NOT import core-sdk runtime code. The `runtime-capabilities` "Unsupported behavior contracts" Requirement is MODIFIED so hooks/utility APIs gracefully degrade rather than throw — resolving a prior pre-existing contradiction with the actual implementation.
- [ ] **API surface triage** (pre-implementation): four internal containers / monitors (`SpatializedContainer`, `Spatialized2DElementContainer`, `SpatializedStatic3DElementContainer`, `SpatialMonitor`) are BREAKING-removed from the default entry — the supported usage is the `enable-xr` / `enable-xr-monitor` JSX markers (originally this triage row pointed at the HOC factories `withSpatialized2DElementContainer` / `withSpatialMonitor`, but those factories were themselves demoted to internal-only in the `internalize-hoc-factories` change). `Entity` (the base Entity component / empty transform group) is retained as a public facade. `createElement` is `@deprecated` in v1 with v2 removal scheduled; in-tree consumers verified zero (no apps/packages/tests import it).
- [ ] **Puppeteer is a first-class spatial-equivalent runtime in v1.** The `runtime-capabilities` snapshot type `'puppeteer'` is produced by the React SDK local parser in the default/server entries and by core-sdk in the spatial/eager implementation graph. The lazy-load bridge recognizes it explicitly: `bootSpatial()` schedules a real `import('@webspatial/react-sdk/spatial')` in puppeteer mode, so `packages/autoTest` exercises the chunk-fetch path end-to-end. Alternatives considered and rejected: (B) bridge no-op + test-only `__internalSetSpatialImpl` hook; (C) v1 keeps puppeteer out of the spec.
- [ ] **React (and `react-dom`) is a hard peer dependency.** `peerDependencies.react: ">=18.0"` + `peerDependenciesMeta.react.optional = false` (currently `true` in `packages/react/package.json:62-65`, flipped during `tasks.md §8.7`). Lazy-load v1 makes the React surface (facades, hooks, JSX runtime, `useSpatialReady`) the package's primary value — the optional flag is now misleading. Alternatives considered and rejected: (B) keep optional + spec note (leaves the contradiction); (C) split a React-less `@webspatial/react-sdk/runtime` subpath (no proven external demand; tracked as a follow-up if real consumers surface).

## Open questions for reviewer input

(Tracked in `design.md` Open Questions; revisit after the first measurement / user-feedback wave)

- Final number for the gzip size budget (target 8KB marginal-delta on typical consumer; calibrate against real measurements during implementation per `tasks.md §12.9`)
- Whether to expose `getBootStatus()` for finer state (v1 says no)
- Whether `bootSpatial({ timeoutMs })` should be a v1 option (v1 says no)
- Cadence for tightening size budget after release

## Recommended review path

1. Skim **`proposal.md`** (~50 lines) for "Why" and "What Changes" first.
2. Read **`spec.md`** Requirements 4 → 5 → 6 → 7 → 8 → 9 in that order — these are where the contract gets specific for lazy-load. Requirements 12 → 13 cover the eager entry and shared packaging hygiene. Requirements 1, 2, 3 are short and sit above; Requirement 11 (Tree-shake friendliness) is a small but normative addition behind Requirement 1.
3. Skim **`design.md`** decisions 1–14 — each decision points back at the relevant spec Requirement. Decision 13 (Size budget framing) explains the marginal-delta vs proxy split; Decision 14 covers the eager entry and shared distribution hygiene.
4. Skim **`tasks.md`** §1–§16 to gauge implementation scope. §9 is size-budget enforcement (proxy + marginal-delta fixture + sideEffects + tree-shake check), §12.9 is the pre-v1 budget calibration follow-up, §13 is SSR validation, §14 is stateless-utility validation, §15 is the facade ↔ real-impl unsupported parity validation, and §16 tracks the eager-mode entry.
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

## Implementation roadmap

This roadmap is historical guidance from the spec-only phase. The active branch has already implemented the foundation, facades/hooks, JSX runtime, default-entry switchover, build/size work, validation/docs, and the code/test portions of the eager entry. Remaining work is tracked directly in `tasks.md`: cross-repo plugin follow-ups (§11), in-house app / framework follow-ups (§12.1–§12.8), and eager documentation / final verification (§16.10–§16.13).

### PR boundary

| PR | Branch (suggested) | Tasks | Risk | Why separate |
| --- | --- | --- | --- | --- |
| 1. Foundation | `feat/lazy-load-foundation` | §1 + §2 + §3.2 + §3.4 | Low — additive only; default entry behavior unchanged | Bridge / boot / detect / errors / `useSpatialReady` are net-new modules; `src/spatial/index.ts` is a bridge-facing namespace that initially re-exports from existing implementation locations. Nothing user-visible flips |
| 2. Facades + hook placeholders | `feat/lazy-load-facades` | §4 + §5 | Medium — many small new files; default entry not yet wired to use them | Each facade ≤ 50 LOC and independently unit-testable; isolating these from §6 / §7 keeps the diff readable |
| 3. Unified JSX runtime | `feat/lazy-load-jsx-runtime` | §6 | Medium — fixes a latent `props.style` mutation bug + deletes `*.web.ts` variants | Depends on PR 2 because `jsx-shared.ts` must point at facade HOCs. Bug-fix character; should NOT wait on the BREAKING switchover |
| 4. Default entry switchover (BREAKING) | `feat/lazy-load-default-entry` | §3.1 + §3.3 + §7 | **High** — entire BREAKING release activates here | One PR's worth of focused review attention on the user-visible changes: 4 internals removed; `createElement` `@deprecated`; top-level `initPolyfill()` deleted; facades go live; real spatial modules are moved/organized here instead of in PR 1 |
| 5. Build config + size enforcement | `feat/lazy-load-build-size` | §8 + §9 | Medium — tsup rewrite + fixture infrastructure | Marginal-delta fixture (Vite consumer with `app-base` / `app-typical` / `app-namespace`) requires the published `dist/` from §8 |
| 6. Validation + docs | `feat/lazy-load-validation-docs` | §10 + §13 + §14 + §15 | Low | Polish: SSR / hydration tests, stateless utility tests, facade ↔ real-impl unsupported parity tests, README, migration guide, CHANGELOG |
| Follow-ups (parallel) | per-task branches | §11 + §12 | Low / mixed | Cross-repo plugin deprecation (`§11`); autoTest migration (`§12.2`); Webpack fixture (`§12.6`); Turbopack investigation (`§12.7`); Module Federation (`§12.8`); pre-v1 budget calibration (`§12.9`, **v1 release blocker** — must run before tagging v1 to confirm or adjust the 8 KB target) |

### Dependency graph

```
PR 1 (Foundation)
  ├── PR 2 (Facades + Hooks)        ← depends on §2 bridge / useSpatialReady
  └── PR 3 (JSX runtime fix)        ← depends on §4 facade HOCs; merge after PR 2
        └──> PR 4 (Default switch BREAKING)
              ├──> PR 5 (Build + Size)
              └──> PR 6 (Validation + Docs)

[Follow-up wave, parallel after PR 4 lands]
  §11 vite-plugin cross-repo deprecation
  §12.2 autoTest migration  →  §12.9 budget calibration (v1 release blocker)
  §12.6 Webpack fixture     →  §12.7 Turbopack
                             →  §12.8 Module Federation
```

PR 1, 2, 3 may all merge to `main` without breaking the existing build because the default entry is not yet rewired to consume facades — `src/spatial/`, the bridge, and the new facades exist as dead code paths. In PR 1, `src/spatial/index.ts` should be a thin bridge-facing namespace that re-exports from the existing implementation locations; do **not** move real implementation files yet. PR 4 is the actual cutover and the right place for §3.1 / §3.3 movement or namespace tightening; pick a low-traffic merge window so any consumer-side breakage surfaces with someone available to triage.

### Acceptance criteria template

Each implementation PR should reference back to the spec via `tasks.md` and the relevant Scenarios. Suggested PR description shape:

> Implements `tasks.md §X + §Y` from spec PR #1170.
>
> **Acceptance criteria**
> - [ ] `bootSpatial()` resolves immediately under SSR (no dynamic import scheduled), per `spec.md` "Boot is a no-op during SSR" Scenario
> - [ ] `loadSpatialImpl()` rejection is wrapped into `WebSpatialBootError` before reaching listeners, per `spec.md` "Spatial chunk load failure is observable" Scenario
> - [ ] (...one bullet per Scenario this PR satisfies)
>
> **Out of scope** (deferred)
> - Size-budget enforcement → PR 5
> - SSR / hydration validation tests → PR 6

### Spec amendments during implementation

If implementation reveals a gap, **do NOT modify the spec from inside an implementation PR**. Either:

- (preferred, while this PR `#1170` is still under review) push the amendment as a new commit to the `openspec/lazy-load-spatial-runtime` branch
- (after this PR merges) open a new OpenSpec change documenting the amendment, then resume the affected implementation PR

This keeps "code review" and "spec amendment review" as two separable signals on `main`.

### Archive

Once all implementation PRs land and CI is green, run `openspec archive lazy-load-spatial-runtime` (per `.codex/skills/openspec-archive-change/SKILL.md`) to move `openspec/changes/lazy-load-spatial-runtime/` into `openspec/archive/<date>-lazy-load-spatial-runtime/`. The change becomes part of the canonical spec history.

---

## Framing decision: two distribution forms, shared packaging hygiene

**Date added:** during PR 6 follow-up review, after the §12.9 calibration + zero-install + spatial-vite-min fixture work landed.

**Context.** This change was originally framed as "lazy-load architecture for the React SDK" — a single-product-decision change. During implementation review the framing surfaced two related concerns:

1. **Reviewer concern (product-orthogonal hygiene is buried).** Most of the contracts in this change — `"sideEffects"` allowlist correctness, `bundle: false` tree-shake friendliness, no top-level observable side effects, named-re-export discipline, peer dependency declarations, ESM-only published shape, `'use client'` directive on hook-using files, type-only re-exports vanishing at runtime, dead-code cleanup (`XR_ENV`), single-package install via `dependencies` migration, type re-exports from `core-sdk` — are **packaging hygiene** that benefits any SDK regardless of whether it ships a lazy-load architecture, an eager bundle, or anything else. Burying them inside a "lazy-load" change made it look as if they only existed to serve the lazy-load product decision; in fact they are independently valuable engineering work that the SDK should retain even if the lazy-load product decision is later reversed.

2. **Reviewer concern (spatial-only consumers pay an unnecessary round-trip).** Lazy-load v1 optimizes for **web-first consumers** (PWAs, marketing pages, web apps that progressively enhance into spatial). But there is a second, distinct consumer profile — **spatial-only consumers** (internal AVP / Pico enterprise apps, App Store apps that ship to fixed spatial devices, deeply spatial-first product surfaces) — for whom the lazy-load round-trip (main chunk parse → `bootSpatial()` → spatial chunk fetch → second parse) is pure overhead. They have no plain-web execution path, they don't benefit from the byte savings, and the extra RTT delays first-interactive render in the AVP simulator.

**Decision.** Rather than treat eager mode as a deferred follow-up (with the risk that future product reversal also kills the hygiene gains), this change is re-scoped to deliver **two distribution forms sharing one packaging-hygiene contract set**:

- The lazy-load default entry (`@webspatial/react-sdk`) — pinned by Requirements §1–§11 of `specs/spatial-lazy-load/spec.md`, implementing web-first progressive enhancement.
- The eager-mode entry (`@webspatial/react-sdk/eager`) — pinned by the new "Eager-mode entry for spatial-only consumers" Requirement, providing spatial-only consumers a single-request alternative that skips the `bootSpatial()` indirection.
- The packaging-hygiene contract set — explicitly enumerated in the new "Two distribution forms share packaging hygiene" Requirement — that holds for both forms regardless of which entry a consumer picks.

**Why this framing instead of a separate follow-up change.**

- **Risk hedging.** If the lazy-load product decision is later reversed (or the web-first consumer profile turns out to be smaller than projected), the eager entry is already a complete, shippable distribution form carrying all the hygiene gains. The team doesn't have to choose between "revert lazy-load and lose all the engineering work" vs "ship lazy-load even if the product profile doesn't match." Both forms exist; product can adjust the recommended default without spec churn.
- **Hygiene independence is now normative.** With the new "Two distribution forms share packaging hygiene" Requirement, future changes that adjust the lazy / eager balance (add a third form, remove one form, restructure) MUST explicitly enumerate which hygiene contracts continue to hold and which need updating. The contracts can no longer be silently weakened as a side effect of distribution-form restructuring.
- **Implementation cost is small and bounded.** The eager entry is ~30 lines of new code (re-exports + four no-op stubs) plus one `tsup` entry, one `package.json` exports mapping, and three small test files. It does NOT require any change to the lazy-load code paths (verified by the new "Default entry's marginal-delta budget is not affected by eager entry's existence" Scenario, which the §16.10 task asserts in CI). Adding it to this change is materially cheaper than opening a separate OpenSpec change with its own propose / review / implement / archive cycle.
- **Sequencing is cleaner.** Both forms ship together in v1, and consumers pick at install time / migration time. Deferring eager to v1.x means consumers who would prefer eager spend the v1 → v1.x interval working around the lazy-load round-trip, then migrate twice (first to v1 with `bootSpatial()`, then to v1.x with the eager entry).

**Trade-off acknowledged.** Reviewers may push back on "two distribution forms" as documentation surface — the README and migration guide MUST present a clear decision tree (§16.11 task). The "Mixed-import shape is not supported" Scenario captures the one footgun consumers can hit; the dev-mode warning that §16.6 task specifies (and the migration guide section §16.11 documents) provides the diagnostic.
