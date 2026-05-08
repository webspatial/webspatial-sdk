# Reviewer guide — `lazy-load-spatial-runtime`

## TL;DR

This **OpenSpec change** replaces the SDK's "dual-build (`dist/web` vs `dist/default`) + alias-switching plugin" architecture with a **runtime lazy-load model**:

- One small default bundle for everyone (≤ 8KB gzip target on `dist/index.js`)
- Spatial implementation lives in a separate `@webspatial/react-sdk/spatial` chunk, loaded dynamically via `await bootSpatial()` only inside a WebSpatial runtime
- Plain web users see documented per-component fallbacks (e.g. `Model` → degraded `<model>` tag) without any extra network requests
- `@webspatial/vite-plugin` becomes redundant — the SDK works against any bundler that supports ESM + `exports` + dynamic-import code-splitting

**No source code changes in this PR.** It is documentation only — proposal, design, tasks, and spec under `openspec/changes/lazy-load-spatial-runtime/`.

## What you're reviewing

| Artifact | What it answers |
| --- | --- |
| `proposal.md` | Why this change & high-level "What Changes" |
| `design.md` | How — 11 design decisions, risks, migration plan, open questions |
| `tasks.md` | 13 sections / 70+ implementation tasks |
| `specs/spatial-lazy-load/spec.md` | New capability — 9 normative Requirements + many Scenarios |
| `specs/runtime-capabilities/spec.md` | Delta to existing capability — 1 MODIFIED + 1 ADDED |

`openspec validate lazy-load-spatial-runtime --strict` passes.

## The 9 Requirements at a glance

| # | Requirement | Scenarios | Anchor concern |
| --- | --- | --- | --- |
| 1 | Default entry MUST NOT bundle spatial implementation | 3 | 8KB gzip budget; symbol absence; complete fallback rendering self-contained in default entry |
| 2 | Spatial implementation MUST live in a dynamically importable subpath | 3 | `import('@webspatial/react-sdk/spatial')`; web never fetches; spatial fetches once |
| 3 | Bridge singleton | 3 | `getSpatialImpl` / `loadSpatialImpl` / SSR safety / load-failure observable |
| 4 | `bootSpatial` is the only activation path | 12 | Single API; idempotent; retry-on-demand; multi-listener `onSpatialLoadError`; `WebSpatialBootError` shape; multi-root sharing; StrictMode safe |
| 5 | Component facades | 8 | Per-component default fallback table (normative); `'use client'`; `displayName`; no `React.memo`; HOC cache identity |
| 6 | Hook placeholders | 7 | Public surface = only `useMetrics` (1/1360 ratio); no mid-life switch; remount picks up real impl |
| 7 | JSX runtime strips spatial markers and wraps with facade HOCs | 8 | Single unified runtime; strip + wrap; `Model` bypass; clone `props.style`; `className` only (not `class`); SSR equivalence |
| 8 | SSR and hydration safety | 7 | Any React 18+ SSR API; `'use client'` on facades; `useSyncExternalStore` for hydration; both boot timings safe |
| 9 | Plugin-free integration | 7 | Capability contract (ESM + `exports` + code-splitting); React peer ≥ 18.0; out-of-scope: Module Federation, Turbopack, Webpack 4, CommonJS |

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
convertCoordinate
```

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

## Decisions to ratify (BREAKING items)

Reviewers, please confirm or push back on these BREAKING decisions:

- [ ] **Hard-cut `@webspatial/react-sdk/web` and `@webspatial/react-sdk/default` subpaths** (no transition window). Old `@webspatial/vite-plugin` aliases will fail to resolve.
- [ ] **`bootSpatial()` is the single activation path.** No `<SpatialBoundary>` / Suspense ergonomics in v1.
- [ ] **Per-facade `props.fallback` is intentionally NOT a v1 API.** Customization via user-side `useSpatialReady()` wrappers.
- [ ] **`@webspatial/vite-plugin` retired** in a follow-up cross-repo issue (not blocking this PR).
- [ ] **In-house apps (`apps/test-server`, `packages/autoTest`, `tests/ci-test`) are NOT migrated** in this change; tracked as follow-up tasks in §12.
- [ ] **8KB gzip size budget** on `dist/index.js` — target, not launch-blocker; first measurement may land at actual value with a TODO to tighten.
- [ ] **`'use client'` directive** required on every facade and every public hook file (RSC compatibility).

## Open questions for reviewer input

(Tracked in `design.md` Open Questions; revisit after the first measurement / user-feedback wave)

- Final number for the gzip size budget (target 8KB)
- Whether to expose `getBootStatus()` for finer state (v1 says no)
- Whether `bootSpatial({ timeoutMs })` should be a v1 option (v1 says no)
- Cadence for tightening size budget after release

## Recommended review path

1. Skim **`proposal.md`** (~50 lines) for "Why" and "What Changes" first.
2. Read **`spec.md`** Requirements 4 → 5 → 6 → 7 → 8 → 9 in that order — these are where the contract gets specific. Requirements 1, 2, 3 are short and sit above.
3. Skim **`design.md`** decisions 1–11 — each decision points back at the relevant spec Requirement.
4. Skim **`tasks.md`** §1–§13 to gauge implementation scope. §13 is SSR validation specifically.
5. Optionally read **`specs/runtime-capabilities/spec.md`** delta if you maintain `runtime-capabilities`.

## Validate locally

```bash
openspec validate lazy-load-spatial-runtime --strict
openspec status --change lazy-load-spatial-runtime
openspec show lazy-load-spatial-runtime           # interactive view
```

## Commit history (11 commits)

The PR was incrementally refined through 8 design-decision passes plus 3 consistency reviews. Each commit message documents a self-contained refinement; `git log --oneline` is a usable secondary index if you want to read the spec's evolution.

---

**No source code is touched in this PR.** Implementation will follow in subsequent PRs aligned with `tasks.md`. The recommended split is `§1 + §2` as a foundation PR, `§3 + §4 + §5 + §6 + §7` as the core feature PR, and `§8 + §9 + §10 + §13` as the build / size budget / SSR validation / docs PR. `§11 / §12` are non-blocking follow-ups.
