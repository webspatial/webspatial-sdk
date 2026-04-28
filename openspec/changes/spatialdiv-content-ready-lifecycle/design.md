# Design: `onSpatialContentReady` for SpatialDiv content lifecycle

## Context

`SpatialDiv` (`enable-xr`) is composed in `@webspatial/react-sdk` via `SpatializedContainer`. The implementation uses DOM structures for layout sampling and transform/visibility tasks, while rendering visible content through a portal into an isolated `windowProxy` document.

If app code binds external renderers (Three.js / Pixi / Babylon, and so on) to the wrong DOM node, or binds at the wrong time, it can produce “resources exist but nothing visible”, resource leaks under StrictMode double-invocation, and ordering bugs when nesting spatial containers.

## Goals / Non-Goals

**Goals:**

- Provide a documented lifecycle callback `onSpatialContentReady` that fires when the **visible content host** is ready for imperative mounting.
- Support returning a cleanup function that runs on unmount, StrictMode simulated teardown, and internal recreation/replacement of the portal content stream.
- Define parent/child ordering for nested `SpatialDiv` so children do not initialize external resources before parents are stable.
- Clarify the meaning of the forwarded `ref`: it is a spatial proxy and is not necessarily the visible mount target for external renderers.

**Non-Goals:**

- This change does not attempt to solve every imperative DOM synchronization problem; layout sizing should remain primarily declarative via React updates.
- This change does not alter existing spatial gesture event payloads or semantics (`onSpatialTap`, drag/rotate/magnify, and so on).

## Decisions

### Decision 1: Add `onSpatialContentReady` (callback + cleanup)

**What**

- `onSpatialContentReady?: (ctx: SpatialContentReadyContext) => void | (() => void)`
- `ctx` MUST include at minimum:
  - `host: HTMLElement` — the portal webview root element app code MAY use as the mount target for imperative external renderers (Three.js canvas DOM, ECharts containers, and so on). Semantically this is the connected portal content root rendered into the isolated `windowProxy` document (not the Standard hidden layout host).

**Why**

- Compared to exposing internal “hidden Standard tree” nodes via `ref`, a callback better models asynchronous readiness and replacement.
- Cleanup mirrors React `useEffect` ergonomics and is easier to review during migration.

**Alternatives considered**

- `ref.getContentHost()` only: easy to misuse from `useEffect([])`; weaker than a push-style readiness signal.
- Documentation-only guidance: does not provide a positive, enforceable API surface.

### Decision 1b: Emit `onSpatialContentReady` on portal content `useLayoutEffect`

**Contract**

- Gate emission on `spatializedElement` + `portalInstanceObject.dom` + connected portal host (`ctx.host.isConnected`).
- Emit from the portal content subtree using `useLayoutEffect` timing (after commit DOM mutations, before paint).
- Never emit during render.
- Treat readiness as `isReady` edge transitions: emit on `false → true`, cleanup on `true → false`, and do not re-emit while `isReady` stays continuously `true`.

**Why**

- Maximizes compatibility with child DOM refs and avoids “ready too early” races.
- Aligns with StrictMode remount expectations when paired with cleanup.

### Decision 2: Ordering contract between `ref` and `onSpatialContentReady`

**Contract**

- When `onSpatialContentReady` is invoked, the spatial container’s forwarded `ref.current` MUST be non-null (when a ref is provided).
- `Model`, `Reality`, and any other component that forwards `ref` through `SpatializedContainer` use the **same** ref gate (Standard + TransformVisibilityTaskContainer). Model load, Reality child entities, and similar native readiness do **not** define a separate ref assignment schedule.
- App code MUST NOT treat `ref.current` as the default mount target for external renderer DOM by default; app code SHOULD mount under `ctx.host` unless the SDK explicitly documents otherwise.
- When cleanup returned from `onSpatialContentReady` runs, app code MUST NOT rely on `ref.current`; cleanup MUST use closed-over handles (`host`, renderer instances, animation tokens).

**Why**

- Today, `ref` availability and portal readiness can be staged; separating “spatial ref is usable” from “visible host is mountable” reduces incorrect assumptions.

### Decision 3: Nested container firing order

**Contract**

- In WebSpatial runtime (portal path), for nested `SpatialDiv`, parent `onSpatialContentReady` MUST run before child `onSpatialContentReady` on the same rising-edge transition where both become ready.
- In WebSpatial runtime (portal path), when a parent is recreated/replaced, child cleanups MUST run depth-first (deepest child first) before parent cleanup, and before the parent emits its next `onSpatialContentReady`.
- In non-WebSpatial fallback (plain DOM path), callback ordering between parent/child `SpatialDiv` is not guaranteed as part of API contract.

**Why**

- Child portal attachment may depend on the parent `Spatialized2DElement` being attached; ordering reduces races.
- Fallback plain DOM readiness is host-attachment driven and may follow different React commit/layout-effect sequencing than portal runtime; documenting this avoids fragile app assumptions.

### Decision 4: Typing surface and degraded rendering

- `onSpatialContentReady` is part of the **SpatialDiv (2D)** public API only (`Spatialized2DElementContainer` / `div` JSX augmentation). It is **not** exposed on `Model`, `Reality`, or static 3D container prop types.
- `WebSpatialJSX.IntrinsicElements['div']` includes `onSpatialContentReady`; other intrinsic tags keep gesture props without this callback (SpatialDiv is `div`-based).
- In non-WebSpatial environments, the fallback plain DOM `SpatialDiv` SHOULD still run `onSpatialContentReady` so app code can use a unified lifecycle API in web-only usage; `ctx.host` is that fallback DOM host.
- In attachment-degraded paths (for example `insideAttachment` plain HTML fallback), callback invocation remains suppressed.
- Across all degraded/plain-HTML paths, the prop MUST NOT leak to real DOM attributes; strip it or ignore it consistently with existing `spatialEventOptions` stripping patterns.

### Decision 5: `ctx.host` anchoring

- `ctx.host` MUST be the portal subtree root DOM instance for the spatialized portal stream (today: the element that backs the root `<El {...} />` of `SpatializedContent` portaled into `windowProxy.document.body`), not an arbitrary body child.
- Implementation MUST ensure ref dispatch completes before emitting `onSpatialContentReady` on the same rising edge (commit ref before portal `useLayoutEffect` ready).

### Decision 6: Verification

- Add package tests covering timing, cleanup, StrictMode remount ordering, nested parent/child order, ref non-null when ready fires, deduped ref callbacks, non-WebSpatial fallback invocation with connected host, and attachment-degraded non-invocation; optional `apps/test-server` pages for interactive validation.

## Risks / Trade-offs

- **[Risk] Wrong timing still causes footguns** → gate firing on the same hard conditions used to render portal content in `PortalSpatializedContainer`, and validate with `apps/test-server` coverage pages.
- **[Risk] StrictMode double initialization** → require idempotent cleanup; implementation SHOULD avoid duplicate ready while `isReady` remains continuously `true`, or MUST run cleanup before the next rising-edge ready.
- **[Risk] Wrong `host` selection** → anchor semantics to the portal content root and document it; if multiple hosts are needed later, introduce an explicit slot API (out of scope for this change).

## Migration Plan

- New API: no mandatory migration for existing apps.
- Documentation migration: replace examples that use `useEffect([])` + child `ref` to initialize Three.js with `onSpatialContentReady` + cleanup.

## Open Questions

- Should `ctx.host` optionally expose `windowProxy` / `Document` for advanced integrations (default: keep API small).
- Should `onSpatialContentReady` include extra metadata for `position: fixed` children to clarify native attach strategy (fixed vs non-fixed paths differ today).