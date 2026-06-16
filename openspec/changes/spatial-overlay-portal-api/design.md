# Design: Radix Floating UI In WebSpatial

The developer contract is defined in `proposal.md`. This document captures the implementation model, tradeoffs, and staged plan.

## 1. Existing Architecture

### 1.1 Dual-instance Model

An `enable-xr` element is routed by `SpatializedContainer` into one of three shapes:

| Environment | Rendered output | Purpose |
| --- | --- | --- |
| Root, no `SpatializedContainerObject` | `StandardSpatializedContainer` host + `PortalSpatializedContainer` webview + probe | Hidden 2D host in the page plus the raised webview |
| Standard instance, in the page tree and not inside a portal | `StandardSpatializedContainer` host + probe | The host is `ref.current` and is the 2D frame source |
| Portal instance, already inside a spatial webview | `PortalSpatializedContainer` only, with its own webview and sub-portal placeholder | Nested child surface |

Every spatial surface is a separate webview. `Spatialized2DElementContainer` renders children into the webview through `createPortal(..., windowProxy.document.body)`.

### 1.2 2D Frame And Placement Sync

- `PortalInstanceObject.notify2DFrameChange()` finds the page-side placeholder with `querySpatialDomBySpatialId`, measures `getBoundingClientRect()`, and syncs rect/style data to native through `updateSpatializedElementProperties`.
- `addToParent()` chooses the native parent:
  - fixed position, or no parent portal: attach to the scene root with `spatialScene.addSpatializedElement`;
  - with a parent portal: attach to the parent `Spatialized2DElement`, creating a child surface.
- Nested coordinate adjustment normally uses `queryParentSpatialDomBySpatialId`, which walks DOM ancestors looking for a node with `SpatialID`.

## 2. Why Scenario 3 Breaks With A Naive Implementation

Scenario 3 is not merely "create another surface." Its purpose is to avoid Scenario 2's limitation: a flat DOM menu inside a parent SpatialDiv is clipped by the parent SpatialDiv's 2D viewport, width, height, and overflow. Scenario 3 should keep the Radix developer shape while letting the menu rise above or in front of the parent panel and remain visible outside the parent bounds.

Target shape:

```tsx
<div enable-xr>
  <DropdownMenu.Root modal={false}>
    <DropdownMenu.Trigger asChild>
      <AvatarButton />
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal container={parentSpatialWindowBody}>
      <DropdownMenu.Content asChild>
        <div enable-xr data-xr-overlay>
          {items}
        </div>
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
</div>
```

Naive behavior:

1. Radix portals `Content asChild` to the parent spatial window body and wraps it in a `data-radix-popper-content-wrapper` using `position: fixed` and transform placement. Trigger and popper are in the same document, which is correct.
2. The inner `div enable-xr` is in a portal-instance environment, so it creates a child webview and moves `{items}` into that child webview.
3. The parent spatial window now has only a placeholder under the popper wrapper. Without overlay mode, that placeholder may not render for fixed/absolute content, so Radix measures `0x0`.
4. Even if a placeholder renders, it is empty because real content moved into the child webview. It still has no intrinsic menu size.
5. Fixed-position content would normally attach to the scene root, not to the parent SpatialDiv.
6. DOM-ancestor coordinate lookup can fail because Radix portals the child under the popper wrapper, not under the parent SpatialDiv content node.
7. If the menu stays flat in the parent webview, it remains clipped like Scenario 2 and does not satisfy the Scenario 3 requirement.

## 3. Core Tension

Raising content as a child spatial surface requires a child webview, which moves visible content out of the parent document.

Radix's full interaction and measurement model wants the floating content to stay in the same document as the trigger.

The current native model has "one surface, one webview" plus parent-child surface attachment. It does not have a primitive that raises an existing DOM sub-rectangle from the parent webview into an independent spatial quad.

Every implementation path is a tradeoff across that tension.

## 4. Candidate Paths

### Path A: Child Webview Content Plus A Radix Measurement Bridge

- The inner `enable-xr` creates child webview B for the visible menu.
- Parent webview A keeps a hidden, real DOM host under the Radix popper wrapper.
- The hidden host receives Radix `asChild` props/ref and renders a hidden copy of menu children, so Radix can measure and place it.
- Rect flow is: Radix positions hidden host in A, WebSpatial reads that rect, native positions child surface B.
- The child surface attaches to the parent SpatialDiv, not the scene root.

Fit:

| Contract item | Result |
| --- | --- |
| Child SpatialDiv rises, attaches to parent, follows, and destroys | Supported |
| Escapes parent 2D bounds | Supported, because B is an independent native surface |
| Popper non-zero and measurable | Supported if the hidden host receives props/ref/children |
| Pointer/tap selection | Supported through React portal event propagation |
| Keyboard, focus, typeahead, focus trap, outside click | Out of scope for the MVP |

Path A is the MVP path. It gives the target developer shape and pointer-driven behavior without requiring native changes.

### Path B: Native Sub-region Elevation

- The inner `enable-xr` would not create a content webview.
- Items stay in parent webview A, so Radix measurement, focus, keyboard, and outside-click behavior remain clean.
- Native would receive a region rect plus back/depth and render that region as an independent quad in front of the parent panel.

Fit: best long-term contract, but requires new native/core primitives and is out of scope for this change.

### Path C: Render In A And Visually Mirror To B

Items render in A for Radix and are cloned or mirrored into B for display. This breaks interaction because focus and event ownership stay in hidden A while the visible B copy receives user input. This path is rejected.

## 5. Recommendation

1. Ship Path A as the MVP. The visible developer code shape is nested `enable-xr` plus Radix plus the declarative `data-xr-overlay` marker, with `modal={false}` and pointer/tap selection as the supported interaction boundary.
2. Track Path B as the native-backed future path. If native sub-region elevation becomes available, the implementation can change under the same developer code shape.

## 6. Architecture Decision Record

### 6.1 Radix Owns Placement, WebSpatial Owns Elevation

The SDK does not replace Radix or any floating UI library. Radix still owns:

- trigger and content relationship;
- `side`, `align`, `offset`, collision, and transform placement;
- pointer/tap selection dispatch through `DropdownMenu.Item`;
- open/close state owned by the application or Radix root.

WebSpatial owns only the spatial part:

- deciding that a marked nested `enable-xr` is an overlay surface;
- keeping a measurable host in Radix's document;
- creating the visible child webview;
- attaching that child surface to the parent SpatialDiv;
- syncing the positioned rect, depth, back offset, and visibility to native.

This separation is intentional. It keeps the integration library-agnostic and avoids reimplementing floating placement logic inside WebSpatial.

### 6.2 Overlay Mode Is Explicit

Overlay mode is a declarative opt-in:

```tsx
<DropdownMenu.Content asChild>
  <div enable-xr data-xr-overlay>
    {items}
  </div>
</DropdownMenu.Content>
```

The SDK must not infer overlay mode from Radix or Floating UI internals. Earlier prototypes sniffed props such as `data-side`, `data-radix-*`, or `--radix-*`. That created three problems:

- it coupled WebSpatial behavior to Radix implementation details;
- it did not generalize cleanly to Floating UI, Headless UI, React Aria, or custom portal code;
- those props can appear after the floating library measures/positions, while `PortalSpatializedContainer` needs a stable overlay decision during the first render.

The `data-xr-overlay` marker is known on the first render, is library-agnostic, and prevents ordinary nested SpatialDivs from being misclassified. A nested `enable-xr` without this marker remains a normal nested SpatialDiv.

### 6.3 Hidden Placeholder Is The Measurement Source

The visible menu items cannot be the measurement source once they move into a child webview. The parent spatial window must keep a hidden but real DOM host under Radix's popper wrapper.

That hidden host:

- receives the `asChild` ref and props that Radix injects into `DropdownMenu.Content`;
- keeps Radix attributes and inline placement style;
- renders a hidden copy of the menu children so the layout is non-zero;
- registers itself with the spatial container object so `notify2DFrameChange()` can measure it.

The visible child webview renders the real interactive copy. There is no child-webview-to-parent size feedback loop in the MVP; the parent hidden host is the source of truth for width, height, and positioned rect.

### 6.4 Overlay Coordinates Use The Parent Spatial Window Rect

For ordinary nested SpatialDivs, WebSpatial may subtract the nearest parent DOM rect to convert page coordinates into parent-relative coordinates.

Floating overlays are different. The overlay placeholder is already inside the parent spatial window, and Radix already places it through the popper wrapper. Therefore overlay mode uses the placeholder's raw `getBoundingClientRect()` in that parent spatial window. It must not:

- subtract a DOM ancestor found through `queryParentSpatialDomBySpatialId`;
- add host page scroll;
- attach fixed overlays to the scene root.

Instead, the overlay child surface attaches to the parent `Spatialized2DElement`, and native receives the raw rect from the parent spatial window.

### 6.5 `SpatialOverlay` Is A Dual-Root Bridge, Not A Positioning Primitive

`SpatialOverlay` exists for plugin-hosted menus where the visible menu shell and plugin items may be rendered by different React roots or shadow roots.

It does not compute placement and does not decide where the menu floats. Its job is to expose two targets with one API:

- a measurement target in Radix's current document;
- a visible portal target in the spatial menu webview.

`portalMenuOption(content)` writes the same content to both targets by default. Advanced callers can pass `portalMenuOption(realContent, measurementContent)` when the real content has side effects or should not fully render in the measurement tree.

The returned node self-subscribes to target mount changes. This matters when a plugin root renders before `OverlayTarget` exists; once the measurement and portal targets mount, the plugin item re-renders and portals into both targets.

### 6.6 Render-Target Context Beats Spatial Window Presence

`useSpatialPortalContainer()` answers "which document body should Radix portal into?" It does not answer "is this render the measurement copy or the visible portal copy?"

Scenario 5 proves the difference. The measurement placeholder for the child menu lives inside the parent spatial window, so `SpatialWindowContext` is present. If `SpatialOverlay` used that alone, it would mistake the measurement placeholder for the visible portal target.

The internal `SpatialOverlayRenderTargetContext` is therefore authoritative:

- visible `PortalSpatializedContainer` content is marked `portal`;
- hidden placeholder content is marked `measurement`;
- `SpatialOverlay` falls back to `SpatialWindowContext` only when no render-target marker exists, such as plain DOM/degraded paths.

### 6.7 Interaction Scope

The MVP supports pointer/tap selection. Keyboard navigation, typeahead, focus trapping, modal focus management, and outside-click semantics across parent and child webviews are explicitly out of scope for this change.

This boundary is part of the design. The current architecture splits visible menu content into a child webview, so full same-document Radix focus semantics are not guaranteed until a future native sub-region elevation model exists.

## 7. Path A SDK Design

### 7.1 Overlay Detection

Overlay mode is an explicit, declarative opt-in via the `data-xr-overlay`
marker (`overlayDetection.ts` -> `isSpatialOverlayContent` /
`SPATIAL_OVERLAY_ATTRIBUTE`).

A nested `enable-xr` enters overlay mode only when:

1. it is in a portal-instance environment and has a parent `PortalInstanceObject`; and
2. its props carry the `data-xr-overlay` marker.

Rationale: the earlier MVP sniffed floating-library positioning signals
(`data-side`, `data-radix-*`, `--radix-*`, etc.). That bound detection to Radix
internals, did not generalize to other floating libraries or custom portals, and
was only resolved after the library measured/positioned, so the render-time
`isOverlayMode` could drift from the instance flag captured in `useMemo`.

A declarative marker is library-agnostic, known on the first render (so the
overlay flag is stable for the element's lifetime), and still avoids
misclassifying ordinary absolute/fixed nested SpatialDivs because they simply do
not carry the marker. Radix (or any library) still injects its `asChild`
ref/props onto the marked element; the SDK mirrors those onto the hidden
placeholder host for measurement/positioning exactly as before.

### 7.2 Hidden Host Dual Render

Root and standard-instance `enable-xr` already render children twice: a hidden standard host with real size for measurement, and a visible webview copy. Scenario 1 works because of that model.

The nested overlay path reuses the same idea:

| Mechanism | Files | Behavior |
| --- | --- | --- |
| Hidden host with children | `SpatializedContainer`, `PortalSpatializedContainer`, placeholder rendering | The overlay placeholder renders children hidden, receives Radix Slot props/ref, and becomes measurable |
| Overlay attach | `PortalInstanceObject.addToParent` | Overlay surfaces attach to the parent `Spatialized2DElement` even when Radix uses fixed positioning |
| Raw rect base | `PortalInstanceObject.updateSpatializedElementProperties` | Overlay placeholder rect is already in the parent spatial-window viewport, so it should not subtract DOM ancestors or add page scroll |

### 7.3 Spike API Removal

The old manual spike hooks are not public API:

- `useSpatialFloatingSurface`
- `useSpatialFloatingOverlayPortal`
- `SpatialFloatingOverlayRoot`
- `useFloatingOverlaySync`

Their useful ideas are moved into the automatic portal branch. The measurement source is the hidden host in the parent document, not child-webview-to-parent size feedback.

## 8. Auto Portal Container Stretch

Radix `Portal` defaults to `globalThis.document.body`, which is the host page document in this React runtime. Inside a SpatialDiv, that can leave the trigger in the spatial window and the content in the host page, producing cross-document measurement problems.

Radix does not read WebSpatial context. Automatic portal routing would require either patching/wrapping Radix Portal behavior or providing a thin SDK wrapper. Until then, `container={useSpatialPortalContainer()}` is the practical transition path.

### 8.1 Plain Browser / Degraded Mode

When there is no WebSpatial session, `enable-xr` degrades to ordinary HTML. `DegradedContainer` provides the host page `window` through `SpatialWindowContext`, so `useSpatialPortalContainer()` returns the host document body within degraded SpatialDiv subtrees.

`undefined` from `useSpatialPortalContainer()` means the caller is outside any SpatialDiv subtree and should use an application default such as `document.body`.

## 9. Path A Data Flow

```text
Radix mounts Content asChild -> inner enable-xr
  |
  |-- Parent spatial window A:
  |     hidden overlay host renders menu children
  |     hidden host receives Radix ref/style/data/handlers
  |     Radix measures non-zero content and positions the popper wrapper
  |
  |-- Child spatial webview B:
  |     same menu children render visibly
  |
  `-- WebSpatial:
        reads hidden host rect in A
        attaches B to the parent SpatialDiv
        syncs clientX/clientY/width/height/back/depth

Pointer item selection in B propagates through React portal ownership to Radix
onSelect, then menu close unmounts B and unregisters the placeholder.
```

## 10. SpatialOverlay Plugin-Host Dual-Root Bridge

Scenario 4/5 are plugin dual-root paths rather than ordinary Radix `Content` children paths:

- The visible root owns the trigger, Radix `DropdownMenu.Content asChild`, and menu shell.
- The plugin or shadow root owns menu items and may only receive a `portalMenuOption` function.

If plugin items render only into the standard host, they are hidden with the placeholder and never appear in the raised menu surface. If plugin items render only into the portal webview, Radix and WebSpatial lose same-document measurement. `SpatialOverlay` packages both targets behind one SDK API.

### 10.1 Public API Shape

```ts
type SpatialOverlayPortalOption = (
  content: React.ReactNode,
  measurementContent?: React.ReactNode,
) => React.ReactNode

function useSpatialOverlay(options: {
  overlayId?: string
  portalTargetName: string
}): {
  OverlayTarget: React.ComponentType<{
    measurementContent?: React.ReactNode
    children?: React.ReactNode
  }>
  portalMenuOption: SpatialOverlayPortalOption
}
```

Contract:

- `OverlayTarget` lives inside the visible spatial menu shell.
- Plugin code receives only `portalMenuOption` and calls `portalMenuOption(content)`.
- When `measurementContent` is omitted, the SDK uses `content` as the measurement copy.
- Advanced callers can pass `portalMenuOption(realContent, measurementContent)` when the real item has side effects or should not be fully rendered in the measurement tree.

### 10.2 Measurement Vs Portal Target Selection

`SpatialOverlay` renders differently depending on which copy of a spatial element is rendering:

| Render target | `SpatialOverlay` output | Purpose |
| --- | --- | --- |
| measurement / placeholder | `<div data-name="${portalTargetName}-measurement">...</div>` | Same-document measurement DOM for Radix/WebSpatial |
| portal / visible content | `<div data-name="${portalTargetName}">...</div>` | Real insertion target inside the spatial menu webview |

`useSpatialPortalContainer()` alone is not enough to choose the target. In Scenario 5, the measurement placeholder for a child overlay already lives inside the parent SpatialDiv's portal webview. `SpatialWindowContext` is therefore present even though this render is still the measurement copy. Treating "has spatial portal container" as "visible portal target" misclassifies the placeholder and can produce an empty measurement target or a zero-height host.

Current design:

- `PortalSpatializedContainer` wraps visible `Content` with internal `SpatialOverlayRenderTargetContext` value `portal`.
- `PortalSpatializedContainer` wraps `PlaceholderEl` with internal `SpatialOverlayRenderTargetContext` value `measurement`.
- `SpatialOverlay` first consults this internal render-target context.
- If the context is absent, `SpatialOverlay` falls back to the legacy heuristic: no spatial portal container means measurement; a spatial portal container means portal.

This keeps Scenario 4 working and fixes the nested Scenario 5 path.

### 10.3 Scenario 4/5 Data Flow

```text
Visible root mounts DropdownMenu.Content asChild -> div enable-xr
  |
  |-- Measurement copy:
  |     OverlayTarget renders measurement target in Radix's current document
  |     portalMenuOption(content) portals hidden/inert content there
  |     Radix/WebSpatial observe non-zero content size
  |
  `-- Portal copy:
        OverlayTarget renders portal target in the spatial menu webview
        portalMenuOption(content) portals real interactive content there
        user sees and taps plugin items
```

For Scenario 5, Radix's current document is the parent SpatialDiv webview, not the host page. The render-target context makes that parent-webview placeholder become measurement instead of being mistaken for the final visible portal target.

### 10.4 Compatibility

Plain Chrome and degraded mode remain compatible:

- `enable-xr` degrades to ordinary DOM.
- `DegradedContainer` provides host `SpatialWindowContext`, so `useSpatialPortalContainer()` returns the host document body inside degraded SpatialDiv subtrees.
- `SpatialOverlayRenderTargetContext` is normally absent in plain DOM paths; `SpatialOverlay` falls back to container-based behavior.

## 11. Risks And Open Questions

1. Overlay misclassification: overlay mode requires explicit `data-xr-overlay`, so ordinary nested SpatialDivs and floating-library props alone must not trigger overlay mode. Tests must cover marker positives and no-marker negatives.
2. `asChild` prop/ref landing: success depends on Radix Slot props/ref landing on the hidden placeholder host. Tests must prove the placeholder receives ref, style, data attributes, handlers, and children.
3. AVP hit testing: jsdom cannot verify native hit testing. AVP smoke must confirm item selection logs once and closes the menu.
4. Timing: the hidden host has intrinsic size directly, avoiding child-to-parent size feedback. Rect-to-native sync still needs batching for Radix reposition events.
5. Coordinate contamination: raw-rect behavior must be guarded by overlay mode and must not affect ordinary nested SpatialDivs.
6. Path B requires native scheduling and does not block this change.

## 12. Task Mapping

- Path A MVP: tasks 5.3-5.7 and 6.x in `tasks.md`.
- Path B native follow-up: add a later native/core-sdk task set if chosen.
- SpatialOverlay plugin bridge: tasks 8.x in `tasks.md`.

## 13. Verification

- Unit tests: `data-xr-overlay` detection positive/negative samples; `asChild` placeholder ref/props/children landing; attach-to-parent behavior; overlay raw-rect behavior.
- `SpatialOverlay.test.tsx`: automatic measurement copy and nested placeholder behavior where `SpatialWindowContext` exists but render target must still be `measurement`.
- Demo: Scenario 3 uses nested `enable-xr` plus Radix; Scenario 4/5 use `useSpatialOverlay()` for plugin dual-root bridging.
- AVP smoke: popper non-zero, child surface visible beyond parent bounds, item tap closes/logs, menu follows parent, and close destroys the surface.
- Scenario 4/5 Safari Inspector smoke: standard or parent target contains measurement target/items; menu surface target contains real plugin items; no visible zero-height or white shell remains on the main page or parent SpatialDiv.

## 14. Minimal Vertical Slice

Principle: first make the Scenario 3 demo pass the three AVP-visible gates with minimal implementation. Add broader abstraction and test hardening afterwards.

Slice gates:

1. Popper is non-zero because the placeholder host has children and Radix ref/props.
2. Child surface is visible beyond the parent because it is an independent surface attached to the parent.
3. Pointer/tap item selection closes and logs through Radix `onSelect`.

Minimal change set:

- Update the dropdown-menu-spatial Scenario 3 demo to nested `enable-xr` plus Radix plus `data-xr-overlay`.
- Forward refs from the portal branch in `SpatializedContainer` to `PortalSpatializedContainer`.
- Detect explicit overlay mode in `PortalSpatializedContainer`.
- Render hidden placeholder children and land Radix ref/props on the placeholder.
- Use overlay raw-rect coordinate behavior in `PortalInstanceContext`.
- Add one focused test proving the portal path lands `asChild` props/ref on the placeholder host.

After the slice:

- Remove spike hooks.
- Add `ResizeObserver` plus requestAnimationFrame reposition sync if needed.
- Expand overlay detection tests for marker and no-marker paths.
- Complete AVP smoke coverage.

## Decisions From 2026-06-09

1. MVP path: ship Path A first, with pointer/tap support and focus/keyboard caveats. Track Path B as a later native-backed replacement that preserves developer code shape.
2. Interaction boundary: accept `modal={false}` and do not guarantee keyboard, focus, typeahead, focus trap, or outside-click semantics for Scenario 3 in this change.
3. Overlay detection initially used nested spatial content plus strong floating positioning signals. That decision is superseded by the explicit marker decision from 2026-06-16.
4. Keyboard/focus/typeahead/focus-trap/outside-click are out of scope. Pointer/tap selection is the required Radix interaction.
5. Escaping parent 2D bounds is the key Scenario 3 distinction. Any future Path B native implementation must also render beyond the parent webview bounds, or it does not satisfy Scenario 3.

## Decisions From 2026-06-16

1. Overlay detection is now an explicit, declarative opt-in via the `data-xr-overlay` marker, replacing the floating-library prop sniffing from Decision 2026-06-09 #3. This decouples the SDK from Radix internals, generalizes to any floating library or custom portal, is known on the first render (removing render-time vs. instance-flag drift), and keeps ordinary nested SpatialDivs unaffected.
2. `portalMenuOption(content)` returns a self-subscribing node, so plugin content rendered from a separate React root that only received `portalMenuOption` still appears once the measurement/portal targets mount.
3. AVP smoke for the Scenario 3 slice gates has passed.
