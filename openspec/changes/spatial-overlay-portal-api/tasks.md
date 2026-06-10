# Tasks: Radix floating UI in WebSpatial (Scenarios 1, 2 & 3)

## 1. Scenario 2 SDK support (Phase A)

- [x] 1.1 Add `SpatialWindowContext` and `useSpatialPortalContainer()` in `packages/react`.
- [x] 1.2 Wrap `Spatialized2DElementContainer` portal output with `SpatialWindowContext.Provider`.
- [x] 1.3 Export `useSpatialPortalContainer` from `@webspatial/react-sdk`.
- [x] 1.4 Add coverage test for `useSpatialPortalContainer()`.

## 2. Demo — Scenarios 1 & 2 (Phase A)

- [x] 2.1 Add `apps/test-server/src/pages/dropdown-menu-spatial/` with Scenario 1 (main page `div enable-xr`).
- [x] 2.2 Add Scenario 2 panel inside SpatialDiv using `useSpatialPortalContainer()`.
- [x] 2.3 Add Scenario 3 placeholder panel.

## 3. Documentation (OpenSpec)

- [x] 3.1 Rewrite proposal/design/spec for Scenarios 1 & 2.
- [x] 3.2 Align proposal + spec to Scenario 3 nested `enable-xr` + Radix developer API.
- [x] 3.3 Slim design.md to TBD; defer implementation decisions to design review.

## 4. Tests and verification — Phase A (Scenarios 1 & 2)

- [ ] 4.1 Run targeted React SDK tests for `SpatialWindowContext`.
- [ ] 4.2 Run `pnpm --filter @webspatial/react-sdk exec tsc -p ./tsconfig.json`.
- [ ] 4.3 Run test-server typecheck/build for the demo page.
- [ ] 4.4 Manual AVP simulator smoke: open Scenario 1 and Scenario 2 menus on the demo route.

## 5. Scenario 3 — minimal vertical slice FIRST (decided 2026-06-09)

> Decision: Path A MVP. Reuse the proven dual-render (placeholder host renders children hidden, like standard-instance). Overlay detection = strong signal (nested + floating library positioning signal), NOT plain positioned ancestor. DOM ancestry hardening can follow later. Keyboard/focus/typeahead/focus-trap/outside-click are explicitly out of scope. See `design.md` §6/§12/§已决策.
>
> Slice gate (all three, verify in AVP before adding abstraction/tests): (1) popper non-0×0, (2) child surface visible beyond parent, (3) tap item closes/logs.

- [x] 5.1 `registerSpatialDom` / overlay fields on `PortalInstanceObject` (spike, reuse).
- [x] 5.2 `PortalInstanceObject.addToParent` overlay attach to parent (spike, reuse).
- [x] 5.3 Demo Scenario 3 → nested `enable-xr` + Radix (contract form); dropped `useSpatialFloatingOverlayPortal` + `OverlayMenuPanel`.
- [x] 5.4 `SpatializedContainer` portal branch forwards `ref` (as `hostRef`) to `PortalSpatializedContainer`.
- [x] 5.5 Overlay detection in `overlayDetection.ts` (`isFloatingOverlayContent`). Tightened: `role` alone does NOT trigger; requires a floating positioning signal (`data-side`/`data-align`/`data-radix-*`/`data-floating-ui-*`/`--radix-*`/`--floating-*`).
- [x] 5.6 `renderOverlayPlaceholder`: renders `children` (hidden, auto-size) + lands Radix `ref`/`style`/`data-*`/handlers on the placeholder host; registers it via `registerSpatialDom`.
- [x] 5.7 `PortalInstanceObject` overlay raw-rect coordinate base (guarded by `isFloatingOverlay`).
- [x] 5.8 Tests: detection positive/negative incl. role-alone & positioned-nested negatives (`overlayDetection.test.ts`); structural render test proving the portal path lands ref/props/children on the hidden host + registers it (`PortalSpatializedContainer.overlay.test.tsx`). Non-zero layout half is AVP-only.
- [ ] 5.9 AVP smoke for the 3 slice gates (popper non-0×0; child surface beyond parent; **tap item selects correct item, logs once, closes** — watch for double-log from dual-render). This remains the final Scenario 3 gate; jsdom/unit tests do not substitute for it.
  - [x] 5.9a Add temporary `[WS-S3]` diagnostics (detection/placeholder/attach/update-push|early-return).
  - [x] 5.9b Root cause confirmed by code review (Cursor + Codex converged): native overlay visibility was coupled to the hidden measurement placeholder (`visibility` undefined → early-return AND/OR `visibility:hidden` → `visible:false`).
  - [x] 5.9c Fix applied: `updateSpatializedElementProperties` decouples overlay native visibility from the placeholder (relaxed guard, identity matrix fallback, `visible = display !== 'none'` for overlay). Unit test added (overlay placeholder hidden → `visible:true`).
  - [x] 5.9c-aid Debug aids (test-server only): `data-name` titles on all scenario webviews; `?s3Open=1` auto-opens Scenario 3 for tap-free screenshot validation.
  - [ ] 5.9c-verify Re-run AVP smoke to confirm the menu shows, escapes parent bounds, and pointer/tap selection logs once then closes.
  - [ ] 5.9d Remove `[WS-S3]` diagnostics and AVP auto-open aids after the AVP smoke passes.
- [x] verify: react-sdk `tsc` clean; detection + overlay-render + portal-instance tests pass (13 tests).
- [x] 5.10 Degraded mode: `DegradedContainer` provides host `SpatialWindowContext` so `useSpatialPortalContainer()` works in plain browser without app fallback (`SpatializedContainer.tsx` + coverage tests).

## 5b. After the slice runs in AVP

- [x] 5b.1 Remove spike modules (`useSpatialFloatingSurface`, `useSpatialFloatingOverlayPortal`, `SpatialFloatingOverlayRoot`, `useFloatingOverlaySync`).
- [ ] 5b.2 `ResizeObserver` + rAF reposition sync (Radix collision/scroll updates).
- [ ] 5b.3 Full overlay-detection unit tests (positive/negative samples), attach-to-parent test.
- [ ] 5b.4 Stretch (separate): optional thin `Portal` wrapper to auto-target spatial window.

## 6. Demo — Scenario 3 (Phase B)

- [x] 6.1 Rewrite Scenario 3 panel to nested `enable-xr` + Radix (matches proposal example); S1 portal host `document.body`; S3 overflow test panel (96px parent, 11 items).
- [x] 6.2 Demo copy: Scenario 2 = flat menu constrained by parent bounds; Scenario 3 = child SpatialDiv (`inner enable-xr`) that escapes parent bounds; shared `menuLayout` styles.

## 7. Tests and verification — Phase B (Scenario 3)

- [x] 7.1 Run targeted React SDK tests for Scenario 3 overlay child SpatialDiv (13 tests pass).
- [x] 7.2 Run `pnpm --filter @webspatial/react-sdk exec tsc -p ./tsconfig.json`.
- [ ] 7.3 Run test-server typecheck/build for the updated demo page.
- [ ] 7.4 Manual AVP smoke: child SpatialDiv rises above/in front of parent, remains visible beyond parent width/height, parent spatial window popper non-zero, menu moves with parent panel.
