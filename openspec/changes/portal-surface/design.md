## Context

`SpatialDiv` already solves most low-level mechanics needed by a raised 2D surface:

- it creates a native `Spatialized2DElement` with an isolated `windowProxy`;
- it renders visible React content with `createPortal(..., windowProxy.document.body)`;
- it mirrors host-page head styles into each portal document through `useSyncHeadStyles` / `windowStyleSync`;
- it exposes the current portal document body through `SpatialWindowContext` and `useSpatialPortalContainer()`;
- it supports degraded plain-web rendering without leaking spatial-only DOM attributes.

The modal problem is a different API shape from `SpatialOverlay`. `SpatialOverlay` bridges pieces of floating UI content across measurement and portal targets. A modal or command palette wants a complete app-level overlay document: mask, wrapper, dialog, footer, focus sentinels, and any nested component-library portals should all live together in the raised document.

## Goals / Non-Goals

**Goals:**

- Add a public React SDK component, `PortalSurface`, that renders children inside a raised, viewport-sized spatial webview.
- Preserve ordinary component DOM structure inside that surface so modal-like UI can style itself with component-local selectors.
- Reuse SpatialDiv portal creation, head-style sync, `SpatialWindowContext`, `useSpatialPortalContainer()`, and spatial CSS variables rather than building a second portal stack.
- Define the styling boundary clearly: host head styles and common root style/class inheritance are supported; arbitrary host-page ancestor DOM selectors are not.
- Support pointer/click interaction for modal close/confirm flows and React state updates owned by the host React tree.
- Provide a predictable degraded behavior for non-WebSpatial environments.

**Non-Goals:**

- Do not automatically rewrite third-party component-library portal targets. Libraries must use `useSpatialPortalContainer()` directly or through an adapter/provider when they need same-document portal content.
- Do not guarantee arbitrary host ancestor selectors such as `.app-shell .page .modal`.
- Do not replace `SpatialOverlay`, `data-xr-overlay`, or floating-library placement semantics.
- Do not solve cross-webview focus trapping, typeahead, keyboard modality, or outside-click semantics beyond documenting the first supported boundary.
- Do not introduce a native sub-region elevation primitive in this change.

## Decisions

### Decision 1: Build `PortalSurface` on SpatialDiv's low-level portal primitives

`PortalSurface` should be implemented as a React component that reuses the
low-level primitives proven by SpatialDiv without delegating to the full
`Spatialized2DElementContainer` abstraction.

`Spatialized2DElementContainer` intentionally dual-renders a hidden standard
host and a visible portal document so ordinary `enable-xr` elements can
participate in host-page layout, measurement, transforms, and nested spatial
composition. `PortalSurface` has a different contract: its children are the
app-level overlay subtree and must be rendered only in the raised webview
document. Rendering the same children into a hidden host document can trigger
duplicate component effects and can cause modal libraries to portal content back
to the main webview.

The component should pass SDK-controlled layout and spatial CSS variables to the underlying spatial host:

```tsx
<PortalSurface zOffset={100}>
  <Modal />
</PortalSurface>
```

The underlying host is responsible for:

- creating the child spatial webview;
- rendering children into `windowProxy.document.body`;
- registering head-style sync;
- providing `SpatialWindowContext` to descendants;
- updating native element properties for a viewport-sized raised surface.

This keeps `PortalSurface` on the same runtime/window/style-sync foundation as
SpatialDiv while avoiding SpatialDiv's hidden-host child render.

**Alternatives considered:**

- Create a new native webview primitive from scratch. Rejected because it would duplicate style sync, lifecycle, ref, and portal-window behavior already maintained by SpatialDiv.
- Delegate to `Spatialized2DElementContainer`. Rejected because that container's
  dual-render standard-instance behavior is correct for `SpatialDiv` but wrong
  for modal-like portal surfaces whose children must exist only in the raised
  document.
- Keep using per-component `modalRender` wrappers. Rejected because it spatializes a partial DOM fragment after the modal library has already chosen host-page structure and portal targets.

### Decision 2: The default sizing mode is viewport

Modal-like UI needs the raised surface to behave like a full app overlay layer. `PortalSurface` should therefore default to the main viewport size rather than content size.

Recommended first API:

```ts
type PortalSurfaceProps = {
  children?: React.ReactNode
  zOffset?: number | string
  backgroundMaterial?: BackgroundMaterialType | 'transparent'
}
```

The first release intentionally keeps the public prop surface small. If future
use cases need content-sized portal surfaces or host-page styling hooks, they
should be designed separately to avoid mixing modal-layer and popover-layer
semantics.

The implementation can express viewport sizing through native surface
properties and the portal body/root style:

- portal document body: transparent background, zero margin, width/height covering the surface;
- spatial offset and material: map `zOffset` and `backgroundMaterial` to native raised-surface properties.

Visibility should be controlled by mounting or unmounting `PortalSurface`.
The first API should not include a `visible` prop because the component owns a
raised webview surface rather than wrapping an already-mounted modal fragment.

**Alternatives considered:**

- Content-sized by default. Rejected for modal-like UI because fixed/centered modal libraries usually expect a viewport coordinate system.
- Expose every sizing mode up front. Rejected to keep the first API small and testable.

### Decision 3: Portal container ownership stays explicit

`PortalSurface` provides the correct document context; it does not automatically patch all UI libraries. Inside a `PortalSurface`, `useSpatialPortalContainer()` must return the raised surface document body.

Component-library adapters should use that container for nested portals. For example, a modal wrapper may translate the hook into the library's `getContainer`, `getPopupContainer`, or equivalent prop.

```tsx
function SpatialModal(props: ModalProps) {
  const container = useSpatialPortalContainer()
  return <Modal {...props} getContainer={() => container ?? document.body} />
}
```

This is the critical step that keeps wrapper, mask, dialog, footer, and close button in the raised document. Without it, a library that reads the host page `document.body` directly may still portal part of its DOM back to the main webview.

**Alternatives considered:**

- Monkey-patch global `document` reads. Rejected as unsafe and incompatible with React/concurrent rendering.
- Provide a universal UI-library integration layer. Rejected for the first release; product integrations can be built on top of the hook contract.

### Decision 4: Style inheritance reuses head sync and documents its boundary

`PortalSurface` should not introduce a new `inheritStyles` option in the first API. The existing SpatialDiv portal stack already mirrors host `document.head` into child windows:

- `<link rel="stylesheet">`;
- `<style>` text and CSSOM rule changes;
- CSS-in-JS rule updates through the head-sync registry;
- `documentElement.className` and `documentElement.style.cssText` during sync.

The component documentation should instead explain the boundary:

- supported: stylesheets, component CSS, CSS Modules output, CSS-in-JS rules injected into the host head, theme classes/styles on `documentElement`, and CSS variables reachable through those mechanisms;
- not guaranteed: selectors that depend on arbitrary host-page ancestors outside the raised document.

This boundary is important for modal style bugs. A selector like `.samantha-modal-root [role='dialog']` can work when both nodes render inside `PortalSurface`; a selector like `.app-shell .settings-page .samantha-modal-root [role='dialog']` is outside the first-release contract unless those context classes are explicitly rendered inside the surface.

**Alternatives considered:**

- Add `inheritStyles={boolean | object}` now. Rejected because the underlying style sync is already implicit for SpatialDiv and a new knob would imply a broader, configurable inheritance contract than the SDK currently provides.
- Clone the entire host app DOM context. Rejected as expensive, fragile, and semantically unclear.

### Decision 5: Degraded behavior is plain DOM with the default hook fallback

In non-WebSpatial environments, `PortalSurface` should degrade to normal React DOM while preserving developer ergonomics:

- render children in the current document;
- let the default-entry `useSpatialPortalContainer()` return `document.body` directly when spatial runtime is not ready;
- avoid leaking spatial-only attributes to DOM;
- avoid creating a separate iframe or synthetic document.

This matches current `SpatialDiv` degraded behavior and lets apps use one code path for plain web and WebSpatial shells.

### Decision 6: Export shape follows existing default/eager routing

`PortalSurface` is public React SDK API. The default entry should expose a facade that is safe before `bootSpatial()` and delegates to the real spatial implementation after readiness using the same lazy-load pattern as other spatial facades. The eager/spatial entries should expose the real implementation.

The implementation should update public-surface tests so `PortalSurface` does not accidentally pull the full spatial implementation into the lean default-entry bundle outside the existing facade routing.

## Risks / Trade-offs

- **[Risk] UI library still portals to the host page** -> Document the container contract, add a demo wrapper that uses `useSpatialPortalContainer()`, and include a test/demo assertion that modal DOM lands in the raised document.
- **[Risk] Full-viewport surface intercepts background input** -> Default the host page placeholder to non-interactive where possible, and validate child surface hit testing with a close-button smoke test. If runtime hit testing cannot distinguish transparent regions, document the limitation and prefer visible/modal-only use cases for the first release.
- **[Risk] Style sync is mistaken for full DOM-context inheritance** -> Put the limitation in the spec and README; include a test or demo using component-local selector styles rather than app-ancestor selectors.
- **[Risk] Default-entry bundle grows** -> Implement through the facade bridge and add/update public-surface or size-budget checks.
- **[Risk] Focus/modal semantics vary across webviews** -> Keep first release acceptance to pointer/click close/confirm and document focus trapping as a later compatibility track.

## Migration Plan

- Existing `modalRender` spatialization remains supported but is no longer the recommended modal integration path.
- Product-level modal wrappers can migrate incrementally by rendering the modal under `PortalSurface` and routing the modal's container prop to `useSpatialPortalContainer()`.
- If a product depends on host-page ancestor selectors for modal styling, migrate those rules to component-local classes or CSS variables before expecting parity in `PortalSurface`.

## Open Questions

- Should a future implementation expose additional ordering aliases such as `zIndex`?
- Should the SDK provide a generic `SpatialPortalProvider` helper for UI libraries that support context-based popup containers?
- Which modal library should be the canonical test-server demo: a small local modal, Semi UI, or both?
