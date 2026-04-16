## ADDED Requirements

### Requirement: SpatialDiv exposes `onSpatialContentReady`

The system SHALL support an optional React prop `onSpatialContentReady` on `enable-xr` / spatialized container elements rendered by `@webspatial/react-sdk`.

The prop MUST be typed as a function:

`onSpatialContentReady?: (ctx: SpatialContentReadyContext) => void | (() => void)`

Where `SpatialContentReadyContext` MUST contain at minimum:

- `host: HTMLElement` — the element application code MAY treat as the mount target for imperative external renderers (for example a Three.js `WebGLRenderer` DOM element).
- `generation: number` — a monotonically increasing integer for this spatial container instance stream (starts at `1` for the first ready event after mount).
- `reason: 'mount' | 'recreated'` — distinguishes the first ready from subsequent ready events caused by internal recreation.

#### Scenario: TypeScript recognizes the prop on intrinsic spatial elements

- **WHEN** an application uses `WebSpatialJSX` typings for a DOM element with `enable-xr`
- **THEN** TypeScript SHALL allow `onSpatialContentReady` without casting to `any`

### Requirement: Ready ordering relative to `ref`

When `onSpatialContentReady` is invoked, the system SHALL guarantee that the spatial container’s forwarded `ref.current` is non-null (when a ref is provided).

Application code MUST NOT assume that `ref.current` is a safe default mount target for external renderers; application code SHALL mount external renderer DOM under `ctx.host` unless documented otherwise by the SDK.

#### Scenario: Ready callback can read a provided ref safely

- **WHEN** a spatial container is mounted with `ref={r}` and `onSpatialContentReady` is invoked
- **THEN** `r.current` MUST NOT be `null`

### Requirement: Ref assignment is gated by both internal hosts and deduplicated

The system SHALL set the forwarded spatial container ref to a non-null proxy value only when BOTH of the following are available:

- the Standard instance host/proxy (`domProxy`), and
- the TransformVisibilityTaskContainer host.

If either dependency is unavailable, the system SHALL set the forwarded ref to `null`.

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

When `SpatialDiv` elements are nested, the system SHALL invoke parent `onSpatialContentReady` before child `onSpatialContentReady` for a given stable render generation.

When a parent spatial container is recreated/replaced, the system SHALL run child cleanups (depth-first: deepest child first) before running parent cleanup, and before emitting the parent’s next `onSpatialContentReady`.

#### Scenario: Parent ready precedes child ready

- **WHEN** a parent `enable-xr` element contains a child `enable-xr` element and both become ready
- **THEN** the parent `onSpatialContentReady` MUST run before the child `onSpatialContentReady`

### Requirement: Degraded / non-XR rendering must not leak the prop to DOM

When spatial features are unavailable and the SDK renders a degraded plain DOM container, the system SHALL NOT forward `onSpatialContentReady` as a real DOM attribute.

If the prop is present in degraded mode, the system SHOULD ignore it or warn in development builds; the exact warning behavior is implementation-defined but MUST NOT crash production rendering.

#### Scenario: Degraded container keeps DOM attribute namespace clean

- **WHEN** `onSpatialContentReady` is passed while rendering degraded plain HTML
- **THEN** the resulting DOM element MUST NOT include an `onSpatialContentReady` attribute

### Requirement: Documentation warns against child DOM ref patterns

The SDK documentation for SpatialDiv MUST explicitly state that child DOM refs inside `enable-xr` containers are not a supported API for synchronizing layout or attaching external renderers, because the underlying DOM may be recreated and/or split across hidden layout hosts and visible portal hosts.

The documentation MUST recommend:

- declarative React updates for layout/size changes, and
- `onSpatialContentReady` + cleanup for external renderer attachment.

#### Scenario: Docs include a Do/Don’t guidance block

- **WHEN** a developer reads the SpatialDiv lifecycle documentation added for this capability
- **THEN** the documentation MUST include at least one “Do” example using `onSpatialContentReady` and at least one “Don’t” example showing `useEffect([])` + child `ref` as a fragile pattern
