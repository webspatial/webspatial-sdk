# Tasks: Radix Floating UI In WebSpatial (Scenarios 1-5)

## 1. Scenario 2 SDK Support (Phase A)

- [x] 1.1 Add `SpatialWindowContext` and `useSpatialPortalContainer()` in `packages/react`.
- [x] 1.2 Wrap `Spatialized2DElementContainer` portal output with `SpatialWindowContext.Provider`.
- [x] 1.3 Export `useSpatialPortalContainer` from `@webspatial/react-sdk`.
- [x] 1.4 Add coverage test for `useSpatialPortalContainer()`.

## 2. Demo: Scenarios 1 And 2 (Phase A)

- [x] 2.1 Add `apps/test-server/src/pages/dropdown-menu-spatial/` with Scenario 1, a main-page `div enable-xr` menu.
- [x] 2.2 Add Scenario 2, a panel inside SpatialDiv using `useSpatialPortalContainer()`.
- [x] 2.3 Add the initial Scenario 3 placeholder panel.

## 3. Documentation (OpenSpec)

- [x] 3.1 Rewrite proposal/design/spec for Scenarios 1 and 2.
- [x] 3.2 Align proposal and spec to the Scenario 3 nested `enable-xr` plus Radix developer API.
- [x] 3.3 Document the Path A MVP design and decision record.
- [x] 3.4 Update proposal/design/spec/tasks for Scenario 4 and Scenario 5 plugin-host `SpatialOverlay` support.
- [x] 3.5 Convert proposal/design/spec/tasks to English-only content.

## 4. Tests And Verification: Phase A (Scenarios 1 And 2)

- [ ] 4.1 Run targeted React SDK tests for `SpatialWindowContext`.
- [ ] 4.2 Run `pnpm --filter @webspatial/react-sdk exec tsc -p ./tsconfig.json`.
- [ ] 4.3 Run test-server typecheck/build for the demo page.
- [ ] 4.4 Manual AVP simulator smoke: open Scenario 1 and Scenario 2 menus on the demo route.

## 5. Scenario 3: Minimal Vertical Slice First

Decision from 2026-06-09: use Path A as the MVP. Reuse the proven dual-render model where the placeholder host renders children hidden, like the standard instance. Overlay detection uses a strong signal: nested spatial content plus floating-library positioning signal. It must not use a plain positioned-ancestor rule. DOM ancestry hardening can follow later. Keyboard, focus, typeahead, focus trap, and outside-click behavior are explicitly out of scope. See `design.md` sections 6, 13, and "Decisions From 2026-06-09".

Slice gates, all requiring AVP verification before broadening abstraction/tests:

1. The popper is non-zero.
2. The child surface is visible beyond the parent.
3. Tapping an item closes/logs through Radix.

- [x] 5.1 Add `registerSpatialDom` and overlay fields on `PortalInstanceObject` from the spike.
- [x] 5.2 Make `PortalInstanceObject.addToParent` attach overlays to the parent.
- [x] 5.3 Rewrite demo Scenario 3 to nested `enable-xr` plus Radix contract form; drop `useSpatialFloatingOverlayPortal` and `OverlayMenuPanel`.
- [x] 5.4 Forward `ref` from the `SpatializedContainer` portal branch as `hostRef` to `PortalSpatializedContainer`.
- [x] 5.5 Add overlay detection in `overlayDetection.ts`. (Updated 2026-06-16: replaced the Radix prop sniffing `isFloatingOverlayContent` with the declarative, library-agnostic `isSpatialOverlayContent` driven by the `data-xr-overlay` marker. See 5b.5.)
- [x] 5.6 Add `renderOverlayPlaceholder`: render children hidden/auto-size, land Radix ref/style/data/handlers on the placeholder host, and register it with `registerSpatialDom`.
- [x] 5.7 Add `PortalInstanceObject` overlay raw-rect coordinate base guarded by `isFloatingOverlay`.
- [x] 5.8 Add tests: overlay detection positives/negatives, role-alone and positioned-nested negatives, and structural render coverage for ref/props/children landing on the hidden host.
- [x] 5.9 AVP smoke for the three slice gates: popper non-zero; child surface beyond parent; item selection logs once and closes. (Passed 2026-06-16.)
  - [x] 5.9a Add temporary `[WS-S3]` diagnostics for detection, placeholder, attach, update push, and early-return paths.
  - [x] 5.9b Confirm root cause by code review: native overlay visibility was coupled to the hidden measurement placeholder.
  - [x] 5.9c Fix overlay native visibility: relax the guard, add identity matrix fallback, and set overlay `visible` from `display !== 'none'`.
  - [x] 5.9c-aid Add test-server debug aids: `data-name` titles on scenario webviews and `?s3Open=1` auto-open for tap-free screenshot validation.
  - [x] 5.9c-verify Re-run AVP smoke to confirm the menu shows, escapes parent bounds, and pointer/tap selection logs once then closes. (Passed 2026-06-16.)
  - [x] 5.9d Remove `[WS-S3]` diagnostics and AVP auto-open aids. Removed during pre-merge review cleanup: dropped the SDK overlay-push probe (`PortalInstanceContext`), the `webspatial-overlay-update` event bridge, and the test-server `useOverlayUpdateProbe` hook. AVP smoke (5.9c-verify) should run against this clean build.
- [x] 5.10 Degraded mode: `DegradedContainer` provides host `SpatialWindowContext` so `useSpatialPortalContainer()` works in plain browser without app fallback.

## 5b. After The Scenario 3 Slice Runs In AVP

- [x] 5b.1 Remove spike modules: `useSpatialFloatingSurface`, `useSpatialFloatingOverlayPortal`, `SpatialFloatingOverlayRoot`, and `useFloatingOverlaySync`.
- [ ] 5b.2 Add `ResizeObserver` plus requestAnimationFrame reposition sync for Radix collision/scroll updates if needed.
- [ ] 5b.3 Add full overlay-detection and attach-to-parent tests.
- [ ] 5b.4 Stretch: optional thin `Portal` wrapper that auto-targets the spatial window.
- [x] 5b.5 Replace Radix-prop overlay sniffing with the declarative `data-xr-overlay` marker (`isSpatialOverlayContent` / `SPATIAL_OVERLAY_ATTRIBUTE`); update demos (Scenario 3 & 5), `overlayDetection.test.ts`, and `PortalSpatializedContainer.overlay.test.tsx`. Removes Radix coupling and the render-time vs. instance-flag drift.
- [x] 5b.6 Make `portalMenuOption(content)` self-subscribing so plugin content from a separate React root appears once targets mount; add the late-mount regression test.

## 6. Demo: Scenario 3 (Phase B)

- [x] 6.1 Rewrite Scenario 3 panel to nested `enable-xr` plus Radix, matching the proposal example.
- [x] 6.2 Update demo copy: Scenario 2 is a flat menu constrained by parent bounds; Scenario 3 is a child SpatialDiv that escapes parent bounds.

## 7. Tests And Verification: Phase B (Scenario 3)

- [x] 7.1 Run targeted React SDK tests for the Scenario 3 overlay child SpatialDiv path.
- [x] 7.2 Run `pnpm --filter @webspatial/react-sdk exec tsc -p ./tsconfig.json`.
- [ ] 7.3 Run test-server typecheck/build for the updated demo page.
- [x] 7.4 Manual AVP smoke: child SpatialDiv rises above/in front of parent, remains visible beyond parent bounds, parent spatial-window popper is non-zero, and the menu moves with the parent panel. (Passed 2026-06-16.)

## 8. SpatialOverlay Plugin-Host Bridge (Scenarios 4 And 5)

Decision: expose SDK-level `SpatialOverlay` / `useSpatialOverlay()` for plugin or shadow-root menu items that need to render into a spatial menu surface while preserving same-document measurement. `portalMenuOption(content)` auto-generates the measurement copy. `portalMenuOption(content, measurementContent)` remains the advanced escape hatch.

- [x] 8.1 Add SDK `SpatialOverlay`, `useSpatialOverlay`, and `SpatialOverlayPortalOption`.
- [x] 8.2 Export `SpatialOverlay`, `useSpatialOverlay`, and related types from `@webspatial/react-sdk`.
- [x] 8.3 Implement automatic measurement copy: omitted `measurementContent` defaults to `content`.
- [x] 8.4 Add internal `SpatialOverlayRenderTargetContext` so nested placeholder/measurement renders are not misclassified as visible portal renders merely because `SpatialWindowContext` exists.
- [x] 8.5 Mark `PortalSpatializedContainer` visible `Content` as render target `portal` and `PlaceholderEl` as render target `measurement`.
- [x] 8.6 Add unit coverage for:
  - [x] direct `SpatialOverlay` measurement render;
  - [x] direct `SpatialOverlay` portal render;
  - [x] automatic `portalMenuOption(content)` measurement and visible copies;
  - [x] nested placeholder inside a parent portal window still rendering measurement content.
- [x] 8.7 Add Scenario 4 demo: flat-page plugin host using `document.body`, `DropdownMenu.Content asChild`, `OverlayTarget`, and plugin items injected via `portalMenuOption`.
- [x] 8.8 Add Scenario 5 demo: parent SpatialDiv plugin host using `useSpatialPortalContainer()`, child `div enable-xr` menu surface, `OverlayTarget`, and plugin items injected via `portalMenuOption`.
- [x] 8.9 Verify current implementation:
  - [x] `pnpm --dir packages/react test` (147 tests);
  - [x] `pnpm --dir packages/react build`;
  - [x] `pnpm --dir apps/test-server test`;
  - [x] `pnpm --dir apps/test-server build`.
- [ ] 8.10 Manual AVP smoke before merge: Scenario 4 and Scenario 5 inspector targets show measurement items in the standard/parent document and real plugin items in the menu surface; item tap logs once and closes.
