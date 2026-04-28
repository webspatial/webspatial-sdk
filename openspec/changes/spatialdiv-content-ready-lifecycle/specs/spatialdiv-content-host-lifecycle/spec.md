## ADDED Requirements

### Requirement: SpatialDiv exposes `onSpatialContentReady`

The system SHALL support an optional React prop `onSpatialContentReady` **only on SpatialDiv** — that is, the **2D** spatial portal path built on `Spatialized2DElementContainer` (typically a `div` with `enable-xr` created through the SDK’s JSX / factory that wires 2D portal content).

The prop MUST NOT appear on the **public** TypeScript surfaces for `Model` (`SpatializedStatic3DElementContainer`), `Reality`, or other non–2D-portal wrappers, and MUST NOT be invoked for those components.

The prop MUST be typed as a function:

`onSpatialContentReady?: (ctx: SpatialContentReadyContext) => void | (() => void)`

Where `SpatialContentReadyContext` MUST contain at minimum:

- `host: HTMLElement` — the portal webview root element application code MAY treat as the mount target for imperative external renderers (for example Three.js canvas DOM, ECharts containers). This MUST refer to the connected portal content root rendered by spatialized portal content (not the Standard hidden layout host).

Implementation note (non-normative): today `SpatializedContent` portals `getJSXPortalInstance(...)` into `windowProxy.document.body`; `ctx.host` MUST be that portal subtree’s root DOM instance (the element backing the root `<El {...} />`), not “the first child of body” by index (body may contain other nodes).

#### Scenario: TypeScript recognizes the prop on SpatialDiv (`div`)

- **WHEN** an application uses `WebSpatialJSX` typings for a `**div`** with `enable-xr` (SpatialDiv)
- **THEN** TypeScript SHALL allow `onSpatialContentReady` without casting to `any`

#### Scenario: Model and Reality do not advertise `onSpatialContentReady`

- **WHEN** an application types `Model` or `Reality` component props
- **THEN** `onSpatialContentReady` MUST NOT be part of those components’ public prop types

### Requirement: `onSpatialContentReady` fires after portal content commit (layout timing)

The system SHALL model portal readiness using `isReady` as defined below and SHALL apply the edge-triggered semantics that follow.

Define `isReady` as ALL of the following:

- `spatializedElement` exists for this spatial container stream, and
- `portalInstanceObject.dom` exists for layout sampling, and
- portal spatialized content has committed at least once such that `ctx.host` refers to an `HTMLElement` with `ctx.host.isConnected === true`.

The system SHALL model readiness as edge-triggered transitions on `isReady`:

- When `isReady` transitions from `false → true`, the system SHALL invoke `onSpatialContentReady` during `useLayoutEffect` timing for the portal content subtree (after DOM mutations from the commit phase, before the browser paints).
- When `isReady` transitions from `true → false`, the system SHALL invoke the cleanup function returned by the prior `onSpatialContentReady` (if any).
- While `isReady` remains continuously `true`, ordinary re-renders MUST NOT re-invoke `onSpatialContentReady`.

The system MUST NOT invoke `onSpatialContentReady` during render.

Application code MAY append imperative external renderer DOM under `ctx.host`. If React-managed children also occupy `ctx.host`, DOM ownership conflicts are possible; the SDK documentation MUST warn about safe partitioning patterns.

#### Scenario: Ready fires after host is connected

- **WHEN** portal spatialized content mounts into the portal document and `ctx.host` becomes connected
- **THEN** `onSpatialContentReady` MUST be invoked in `useLayoutEffect` timing and `ctx.host.isConnected` MUST be true

#### Scenario: No ready during render

- **WHEN** React is rendering spatialized portal content
- **THEN** `onSpatialContentReady` MUST NOT be invoked synchronously during render

#### Scenario: Stable ready does not re-emit on re-render

- **WHEN** `isReady` remains continuously `true` across one or more re-renders
- **THEN** `onSpatialContentReady` MUST NOT be invoked again

### Requirement: Ready ordering relative to `ref`

When `onSpatialContentReady` is invoked, the system SHALL guarantee that the spatial container’s forwarded `ref.current` is non-null (when a ref is provided).

The implementation SHALL ensure spatial ref assignment (`updateDomProxyToRef`) has completed **before** `onSpatialContentReady` runs for the same rising edge (for example ref attachment during the commit phase precedes portal `useLayoutEffect` that emits ready).

Application code MUST NOT assume that `ref.current` is a safe default mount target for external renderers; application code SHALL mount external renderer DOM under `ctx.host` unless documented otherwise by the SDK.

#### Scenario: Ready callback can read a provided ref safely

- **WHEN** a spatial container is mounted with `ref={r}` and `onSpatialContentReady` is invoked
- **THEN** `r.current` MUST NOT be `null`

### Requirement: Ref assignment is gated by both internal hosts and deduplicated

The system SHALL set the forwarded spatial container ref to a non-null proxy value only when BOTH of the following are available:

- the Standard instance host/proxy (`domProxy`), and
- the TransformVisibilityTaskContainer host.

If either dependency is unavailable, the system SHALL set the forwarded ref to `null`.

All components that forward refs through `SpatializedContainer` (including SpatialDiv, `Model`, `Reality`, and other wrappers on that pipeline) SHALL use this same dual-host gate for forwarded `ref` assignment timing. They SHALL NOT use a distinct ref-assignment rule based solely on specialized content readiness (for example glTF/model load completion, or Reality scene or child-entity readiness) in place of this requirement. (This requirement applies to `**ref` only**; `onSpatialContentReady` remains SpatialDiv-only per the prior requirement.)

The system SHALL deduplicate ref dispatches:

- if the effective outgoing ref value is already `null`, it MUST NOT dispatch `null` again;
- if the effective outgoing ref value is already the same non-null proxy object, it MUST NOT dispatch it again.

This deduplication requirement applies to both object refs (`ref.current = ...`) and callback refs (`ref(value)`).

#### Scenario: No duplicate callback for unchanged null state

- **WHEN** internal updates occur while either host is still unavailable and the effective ref value remains `null`
- **THEN** callback refs MUST NOT be invoked repeatedly with `null`

#### Scenario: No duplicate callback for unchanged non-null state

- **WHEN** internal updates occur while both hosts remain available and the effective ref value remains the same proxy object
- **THEN** callback refs MUST NOT be invoked repeatedly with the same non-null object

#### Scenario: Model and Reality use the same spatial ref timing as SpatialDiv

- **WHEN** `Model` or `Reality` mounts with `ref={r}` in a WebSpatial-capable session (not degraded)
- **THEN** `r.current` SHALL become non-null only under the same Standard + TransformVisibilityTaskContainer dual-host conditions as other `SpatializedContainer` usages; assignment MUST NOT be deferred until model load completes or Reality-specific composition alone would allow it without both hosts

### Requirement: Cleanup function semantics

If `onSpatialContentReady` returns a function, the system SHALL invoke that function:

- before the next `onSpatialContentReady` call for the same spatial container stream, and
- when the spatial container is unmounted, and
- when a ready stream is cancelled/aborted due to internal teardown (for example StrictMode simulated unmount)

The cleanup function MUST be safe to call multiple times (idempotent) from the SDK side; the SDK SHOULD avoid double-invocation, but application code MUST still tolerate redundant cleanup calls defensively.

#### Scenario: StrictMode mount/unmount/remount releases external resources

- **WHEN** React StrictMode causes a subtree to unmount and remount during development
- **THEN** cleanup returned from the first `onSpatialContentReady` MUST be invoked before the second `onSpatialContentReady` for the remounted instance stream

### Requirement: Nested SpatialDiv ordering

In WebSpatial runtime (portal path), when `SpatialDiv` elements are nested, the system SHALL invoke parent `onSpatialContentReady` before child `onSpatialContentReady` for a given commit where both become ready on the same `isReady` rising edge transition.

In WebSpatial runtime (portal path), when a parent spatial container is recreated/replaced, the system SHALL run child cleanups (depth-first: deepest child first) before running parent cleanup, and before emitting the parent’s next `onSpatialContentReady`.

In non-WebSpatial fallback (plain DOM path), parent/child callback ordering is implementation-dependent and MUST NOT be treated as a stable API contract by application code.

#### Scenario: Parent ready precedes child ready

- **WHEN** a parent `enable-xr` element contains a child `enable-xr` element and both become ready in WebSpatial runtime
- **THEN** the parent `onSpatialContentReady` MUST run before the child `onSpatialContentReady`

#### Scenario: Non-WebSpatial fallback does not guarantee parent/child callback order

- **WHEN** a parent plain-DOM fallback `SpatialDiv` contains a child fallback `SpatialDiv`
- **THEN** parent and child `onSpatialContentReady` callback ordering MUST be considered unspecified by API contract

### Requirement: Non-WebSpatial fallback must keep API usable without leaking DOM attributes

When WebSpatial runtime is unavailable and the SDK renders a plain DOM `SpatialDiv` fallback, the system SHALL still support `onSpatialContentReady` for that fallback path.

For this fallback path:

- The callback MUST run in `useLayoutEffect` timing (never during render).
- `ctx.host` MUST be the connected fallback DOM host element rendered by that `SpatialDiv`.
- Returned cleanup semantics MUST match the primary requirement (unmount / teardown / re-ready boundaries).

When rendering any plain HTML degraded path, the system SHALL NOT forward `onSpatialContentReady` as a real DOM attribute.

Attachment-degraded fallback (for example `insideAttachment`) MUST continue to suppress `onSpatialContentReady` invocation, because no supported spatial content host contract is provided there.

#### Scenario: Degraded container keeps DOM attribute namespace clean

- **WHEN** `onSpatialContentReady` is passed while rendering degraded plain HTML
- **THEN** the resulting DOM element MUST NOT include an `onSpatialContentReady` attribute

#### Scenario: Non-WebSpatial fallback still invokes ready

- **WHEN** WebSpatial runtime is unavailable and `onSpatialContentReady` is passed to SpatialDiv
- **THEN** `onSpatialContentReady` MUST be called with a connected fallback host element

#### Scenario: Attachment-degraded path does not invoke ready

- **WHEN** attachment fallback renders plain HTML and `onSpatialContentReady` is passed
- **THEN** `onSpatialContentReady` MUST NOT be called

### Requirement: Documentation warns against child DOM ref patterns

The SDK documentation for SpatialDiv MUST explicitly state that child DOM refs inside `enable-xr` containers are not a supported API for synchronizing layout or attaching external renderers, because the underlying DOM may be recreated and/or split across hidden layout hosts and visible portal hosts.

The documentation MUST recommend:

- declarative React updates for layout/size changes, and
- `onSpatialContentReady` + cleanup for external renderer attachment.
- treating nested parent/child callback ordering as runtime-dependent: guaranteed in WebSpatial runtime, unspecified in non-WebSpatial fallback.

#### Scenario: Docs include a Do/Don’t guidance block

- **WHEN** a developer reads the SpatialDiv lifecycle documentation added for this capability
- **THEN** the documentation MUST include at least one “Do” example using `onSpatialContentReady` and at least one “Don’t” example showing `useEffect([])` + child `ref` as a fragile pattern

### Requirement: Acceptance test matrix

The implementation MUST be verified by automated tests (primary) and MAY be supplemented by `apps/test-server` manual scenarios.

Automated tests SHALL cover at minimum:

- `isReady` rising edge invokes `onSpatialContentReady` in layout-effect timing; `ctx.host.isConnected` is true; no synchronous invocation during render.
- `isReady` stable across re-renders does not re-invoke `onSpatialContentReady`.
- `isReady` falling edge invokes prior cleanup before the next rising edge.
- StrictMode-style remount: cleanup from the first ready runs before the second ready.
- Forwarded spatial `ref`: non-null when ready is invoked; ref callback deduplication per prior requirements.
- Non-WebSpatial fallback: prop stripped from DOM attribute space; `onSpatialContentReady` still called with connected fallback host.
- Attachment-degraded path: prop stripped from DOM attribute space; `onSpatialContentReady` never called.
- Nested spatial containers: in WebSpatial runtime, parent ready before child ready on the same rising edge where both become ready; in non-WebSpatial fallback, ordering is unspecified.

#### Scenario: CI exercises the matrix

- **WHEN** the React package test suite runs for this change
- **THEN** it SHALL include tests that satisfy the acceptance matrix above