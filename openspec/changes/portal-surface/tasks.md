## 1. Public API And Routing

- [ ] 1.1 Add the public `PortalSurface` prop types and component facade for the default React SDK entry.
- [ ] 1.2 Export `PortalSurface` and its related types from the default, eager, and spatial React SDK entry points without exposing internal container modules directly.
- [ ] 1.3 Add or update public-surface tests to ensure `PortalSurface` is exported and the default entry keeps the existing lazy facade routing boundary.

## 2. Core PortalSurface Implementation

- [ ] 2.1 Implement the real `PortalSurface` component by reusing SpatialDiv's low-level spatial webview creation, head-style sync, and `SpatialWindowContext` primitives without rendering children through the hidden standard host.
- [ ] 2.2 Add viewport-sized native surface properties and raised portal document root styles.
- [ ] 2.3 Map `zOffset` and `backgroundMaterial` to native spatial surface properties.
- [ ] 2.4 Ensure the raised portal document keeps transparent background and full-surface body/root sizing suitable for modal layouts.
- [ ] 2.5 Keep visibility controlled by mounting/unmounting `PortalSurface`; do not expose a `visible` prop.
- [ ] 2.6 Preserve degraded plain-web rendering by rendering children in the host document and providing host `SpatialWindowContext`.

## 3. Portal Container Integration

- [ ] 3.1 Verify `useSpatialPortalContainer()` returns the raised surface document body for descendants inside `PortalSurface`.
- [ ] 3.2 Add a small modal adapter example or helper that routes the modal library container prop to `useSpatialPortalContainer()`.
- [ ] 3.3 Document that component libraries which hard-code host `document.body` must opt into the spatial portal container to keep their modal DOM inside the raised document.

## 4. Documentation And Demo

- [ ] 4.1 Add `PortalSurface` API documentation to the React SDK README or a focused docs page.
- [ ] 4.2 Document the style inheritance boundary: head styles and common root class/style sync are supported; arbitrary host-page ancestor selectors are not.
- [ ] 4.3 Add an `apps/test-server` demo showing a controlled modal inside `PortalSurface` with open, close, cancel, and confirm interactions.
- [ ] 4.4 Include an example that demonstrates component-local modal styling working inside the raised document.

## 5. Automated Tests

- [ ] 5.1 Add unit tests for degraded `PortalSurface` rendering, including no spatial-only DOM attribute leakage.
- [ ] 5.2 Add unit tests that `useSpatialPortalContainer()` inside `PortalSurface` resolves to the raised document body in the spatial portal path.
- [ ] 5.3 Add unit tests or integration tests for viewport-sized native surface semantics, `zOffset` / material mapping, and no host-document render in the spatial portal path.
- [ ] 5.4 Add regression coverage showing component-local selector styles are available through existing portal head sync.
- [ ] 5.5 Add type or runtime coverage showing `PortalSurface` does not expose a `visible` prop.
- [ ] 5.6 Add regression coverage showing `PortalSurface` inside `SpatialDiv` skips the hidden standard-instance copy and creates only from the visible portal-instance copy.

## 6. Verification

- [ ] 6.1 Run focused React SDK tests for `PortalSurface`, `SpatialWindowContext`, and portal head sync.
- [ ] 6.2 Run `pnpm --filter @webspatial/react-sdk exec tsc -p ./tsconfig.json`.
- [ ] 6.3 Run `pnpm --dir apps/test-server test` and `pnpm --dir apps/test-server build` after adding the demo.
- [ ] 6.4 Run manual AVP simulator smoke: open the `PortalSurface` modal, confirm it is raised and styled, click close/cancel/confirm, and verify host React state updates.
