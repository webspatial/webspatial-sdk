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
  - `host: HTMLElement` — the element app code MAY use as the mount target for imperative external renderers (by default, the portal content root host; implementation details may evolve, but the semantic meaning must remain stable).
  - `generation: number` — monotonically increasing within a spatial container instance stream (starts at `1` for the first ready after mount).
  - `reason: 'mount' | 'recreated'` — distinguishes the first ready from subsequent ready events caused by internal recreation.

**Why**

- Compared to exposing internal “hidden Standard tree” nodes via `ref`, a callback better models asynchronous readiness and replacement.
- Cleanup mirrors React `useEffect` ergonomics and is easier to review during migration.

**Alternatives considered**

- `ref.getContentHost()` only: easy to misuse from `useEffect([])`; weaker than a push-style readiness signal.
- Documentation-only guidance: does not provide a positive, enforceable API surface.

### Decision 2: Ordering contract between `ref` and `onSpatialContentReady`

**Contract**

- When `onSpatialContentReady` is invoked, the spatial container’s forwarded `ref.current` MUST be non-null (when a ref is provided).
- App code MUST NOT treat `ref.current` as the default mount target for external renderer DOM by default; app code SHOULD mount under `ctx.host` unless the SDK explicitly documents otherwise.
- When cleanup returned from `onSpatialContentReady` runs, app code MUST NOT rely on `ref.current`; cleanup MUST use closed-over handles (`host`, renderer instances, animation tokens).

**Why**

- Today, `ref` availability and portal readiness can be staged; separating “spatial ref is usable” from “visible host is mountable” reduces incorrect assumptions.

### Decision 3: Nested container firing order

**Contract**

- For nested `SpatialDiv`, parent `onSpatialContentReady` MUST run before child `onSpatialContentReady` for a stable render generation.
- When a parent is recreated/replaced, child cleanups MUST run depth-first (deepest child first) before parent cleanup, and before the parent emits its next `onSpatialContentReady`.

**Why**

- Child portal attachment may depend on the parent `Spatialized2DElement` being attached; ordering reduces races.

### Decision 4: Typing surface and degraded rendering

- `onSpatialContentReady` is added to `WebSpatialJSX.IntrinsicElements` alongside existing spatial gesture props.
- In non-WebSpatial environments or degraded rendering paths (for example `DegradedContainer`), the prop MUST NOT leak to real DOM attributes; strip it or ignore it consistently with existing `spatialEventOptions` stripping patterns.

## Risks / Trade-offs

- **[Risk] Wrong timing still causes footguns** → gate firing on the same hard conditions used to render portal content in `PortalSpatializedContainer`, and validate with `apps/test-server` coverage pages.
- **[Risk] StrictMode double initialization** → require idempotent cleanup; implementation SHOULD avoid duplicate ready for the same `generation`, or MUST run cleanup before a duplicate ready.
- **[Risk] Wrong `host` selection** → anchor semantics to the portal content root and document it; if multiple hosts are needed later, introduce an explicit slot API (out of scope for this change).

## Migration Plan

- New API: no mandatory migration for existing apps.
- Documentation migration: replace examples that use `useEffect([])` + child `ref` to initialize Three.js with `onSpatialContentReady` + cleanup.

## Open Questions

- Should `ctx.host` optionally expose `windowProxy` / `Document` for advanced integrations (default: keep API small).
- Should `onSpatialContentReady` include extra metadata for `position: fixed` children to clarify native attach strategy (fixed vs non-fixed paths differ today).
