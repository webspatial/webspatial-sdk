# Proposal: Radix Floating UI In WebSpatial (Scenarios 1-5)

## Why

Radix UI and similar floating UI libraries render menus, popovers, and related overlays outside the trigger subtree through portals. They then use normal DOM geometry, such as `getBoundingClientRect`, collision detection, `side`, and `align`, to compute placement.

WebSpatial applications need five related integration modes. This change keeps the first three ordinary Radix menu modes close to native Radix usage, and adds an SDK-level `SpatialOverlay` bridge for plugin or dual-root menus. The SDK bridges overlay content into the correct measurement DOM and spatial portal DOM. It does not fork Radix and does not reimplement floating placement.

## Scenario Matrix

| | Scenario 1 | Scenario 2 | Scenario 3 | Scenario 4 | Scenario 5 |
| --- | --- | --- | --- | --- | --- |
| Trigger location | Main page, flat DOM | Inside a raised SpatialDiv | Inside a raised SpatialDiv | Main-page plugin host | Plugin host inside a parent SpatialDiv |
| Menu presentation | New spatial surface | Flat 2D UI in the same spatial window, constrained by the parent panel | Overlay SpatialDiv used as floating UI content | Independent spatial menu shell, plugin items injected from another root | Overlay SpatialDiv menu surface, plugin items injected from another root in the parent spatial window |
| Inner `enable-xr` | Required | Not used | Required, nested + `data-xr-overlay` | Required on menu surface | Required on child menu surface + `data-xr-overlay` |
| Radix `Portal container` | `document.body` or `#root` | `useSpatialPortalContainer()` during the transition | Ideally omitted; transition path matches Scenario 2 | `document.body` | `useSpatialPortalContainer()` |
| Developer mental model | Main-page trigger opens a raised menu | Panel trigger opens a normal in-panel dropdown | Panel trigger opens another raised child panel for the menu | Plugin receives only `portalMenuOption` and contributes items | Plugin inside SpatialDiv also receives only `portalMenuOption` and contributes items |

Scenario 2 and Scenario 3 differ by whether the floating content itself becomes an Overlay SpatialDiv:

- Scenario 2: the menu is ordinary 2D DOM inside the parent SpatialDiv. It does not become its own spatial surface and is therefore constrained by the parent SpatialDiv's 2D viewport, size, and clipping.
- Scenario 3: the floating content is a child SpatialDiv marked as overlay content. It keeps a same-document measurement host for the floating UI system and renders the visible content in a child spatial surface.

The practical distinction is simple: use plain `enable-xr` for ordinary SpatialDiv content, and use `enable-xr data-xr-overlay` when the nested SpatialDiv is the popup layer/content controlled by a floating UI or portal system.

## Developer Mental Model

### Scenario 1

I place a trigger on the main page. When it opens, the menu rises as an independent spatial surface.

### Scenario 2

I already have a raised SpatialDiv panel. When a trigger inside that panel opens, the menu appears inside the same panel like a normal web dropdown. If the menu exceeds the panel bounds, it is still constrained by that panel.

### Scenario 3

I already have a raised SpatialDiv panel. When a trigger inside that panel opens floating UI, the popup content can be an Overlay SpatialDiv: the floating UI system still measures and positions a host in the current document, while WebSpatial renders the visible popup as a child surface above or in front of the panel.

Scenario 3 does not introduce a new spatial primitive. The outer `enable-xr` is the parent panel; the inner `enable-xr` is the popup surface. The `data-xr-overlay` marker declares that this nested SpatialDiv is floating UI content. The SDK then keeps a hidden measurement host in the floating UI system's document and renders the visible content as a child surface. Radix, Floating UI, or a custom portal system continues to own placement and pointer/tap selection. Keyboard navigation, focus, typeahead, focus trap, and outside-click dismissal are not in scope for the first Scenario 3 milestone.

The `data-xr-overlay` marker is a declarative, library-agnostic opt-in. The SDK does not sniff floating-library internals (`data-radix-*`, `data-side`, `--radix-*`) to decide overlay mode; any floating library or a custom portal works as long as the surface carries the marker.

Use this rule:

- Use `<div enable-xr>` for ordinary spatial content, panels, cards, or nested SpatialDivs that are part of normal layout.
- Use `<div enable-xr data-xr-overlay>` when the element is the popup layer/content of a menu, popover, tooltip, context menu, floating toolbar, or another portal-based UI that expects to measure and position that element in the current document.

`useSpatialPortalContainer()` is not the Scenario 3 mental model. It is transition plumbing shared with Scenario 2 until automatic portal routing exists.

### Scenario 4 / 5

Menu items may come from a plugin system, shadow root, or separate React root. In real product plugin systems, plugin code may only receive a "submit menu item" function and may not participate in the visible menu shell JSX or provide a separate measurement copy.

Scenario 4/5 introduce `SpatialOverlay` / `useSpatialOverlay()` as the SDK-level bridge:

- The visible root owns Radix `DropdownMenu.Content asChild` and the spatial menu shell.
- The plugin or shadow root owns menu items and submits them through `portalMenuOption(content)`.
- The SDK renders `content` into two places:
  - a measurement target in the Radix document for Radix, DOM layout, and WebSpatial sizing;
  - a portal target in the spatial menu surface webview for the real visible and interactive item.
- If the automatic measurement copy is not appropriate, plugin code can call `portalMenuOption(realContent, measurementContent)`.

## Target Developer API

### Scenario 1: Main-Page Floating Menu

```tsx
<DropdownMenu.Portal container={document.body}>
  <DropdownMenu.Content side="bottom" align="end" asChild>
    <div
      enable-xr
      style={{
        '--xr-back': 0,
        '--xr-depth': 0,
        '--xr-background-material': 'transparent',
      }}
    >
      <DropdownMenu.Item>Login / Register</DropdownMenu.Item>
    </div>
  </DropdownMenu.Content>
</DropdownMenu.Portal>
```

Contract:

- Use `Content asChild` with an inner `div enable-xr`.
- Portal to the main document, such as `document.body` or `#root`.
- `useSpatialPortalContainer()` is not needed.

### Scenario 2: Flat Menu Inside SpatialDiv

```tsx
function SpatialDivMenu() {
  const container = useSpatialPortalContainer()

  return (
    <DropdownMenu.Portal container={container}>
      <DropdownMenu.Content side="bottom" align="end">
        <DropdownMenu.Item>Login / Register</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  )
}
```

Contract:

- Do not use an inner `enable-xr` for the menu.
- Use `container={useSpatialPortalContainer()}` during the transition, because Radix otherwise portals out of the spatial window.
- The menu renders as ordinary DOM in the parent SpatialDiv's spatial window.
- The menu remains constrained by the parent SpatialDiv's 2D viewport, size, and clipping.

### Scenario 3: Child SpatialDiv Floating Menu

Ideal path: nested `enable-xr data-xr-overlay` and a floating UI library, with no imperative WebSpatial hook. The example below uses Radix DropdownMenu, but the marker is not Radix-specific.

```tsx
function SpatialDivFloatingMenu() {
  return (
    <div enable-xr style={{ '--xr-back': 120, '--xr-depth': 80 }}>
      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger asChild>
          <AvatarButton />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content side="bottom" align="end" asChild>
            <div
              enable-xr
              data-xr-overlay
              style={{
                '--xr-back': 12,
                '--xr-depth': 40,
                '--xr-background-material': 'thin',
              }}
            >
              <DropdownMenu.Item>Login / Register</DropdownMenu.Item>
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  )
}
```

Transition path before automatic portal routing:

```tsx
const container = useSpatialPortalContainer()

<DropdownMenu.Portal container={container}>
  {/* Same shape as above: Content asChild + inner div enable-xr */}
</DropdownMenu.Portal>
```

Contract:

- The outer `div enable-xr` is the parent panel.
- `Content asChild` with an inner `div enable-xr` marked `data-xr-overlay` creates an Overlay SpatialDiv for floating UI content.
- The `data-xr-overlay` marker is the declarative, library-agnostic opt-in for overlay mode. It preserves the same-document measurement host required by the floating UI system and renders the visible content as a child spatial surface.
- Without `data-xr-overlay`, the nested `enable-xr` behaves like an ordinary nested SpatialDiv. In a floating-content composition, that means the floating UI system may not receive a measurable host and the popup can be incorrectly sized or positioned.
- The visible popup remains complete when the floating UI system positions it outside the parent panel's visible rectangle.
- Do not introduce Scenario-3-specific hooks such as `useSpatialFloatingSurface()` or `useSpatialFloatingOverlayPortal()`. The marker is a declarative attribute, not an imperative hook.
- Do not replace Radix with hand-written `createPortal` menu logic.
- `modal={false}` is recommended for the MVP.

### Scenario 4/5: Plugin-Host Dual-Root Menu

```tsx
function PluginHostMenu() {
  const { OverlayTarget, portalMenuOption } = useSpatialOverlay({
    portalTargetName: 'plugin-menu-target',
  })

  return (
    <>
      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger asChild>
          <button>Open plugin menu</button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal container={portalContainer}>
          <DropdownMenu.Content side="bottom" align="start" asChild>
            <div enable-xr data-xr-overlay data-name="plugin-menu-surface">
              <OverlayTarget />
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <PluginRoot portalMenuOption={portalMenuOption} />
    </>
  )
}

function PluginRoot({
  portalMenuOption,
}: {
  portalMenuOption: SpatialOverlayPortalOption
}) {
  return portalMenuOption(
    <DropdownMenu.Item>Drive Attachment</DropdownMenu.Item>,
  )
}
```

Contract:

- Place `OverlayTarget` inside the visible spatial menu surface.
- Scenario 5 (nested in a parent SpatialDiv) marks the menu surface `enable-xr` with `data-xr-overlay` so it rises as a child surface. Scenario 4 (flat page) is a root surface and does not need the marker.
- Plugin systems only need to receive and call `portalMenuOption(content)`.
- The SDK uses `content` as the measurement copy by default. The optional second argument, `measurementContent`, is an advanced escape hatch.
- Scenario 4 uses `document.body` as `portalContainer`.
- Scenario 5 reads `portalContainer` from `useSpatialPortalContainer()` inside the parent SpatialDiv.
- `SpatialOverlay` does not own placement. Radix or the floating UI library still owns side, align, collision, and transform placement.

## SDK Guarantees

These are proposal-level acceptance criteria. Implementation details live in `design.md`.

### Common To All Scenarios

- Child-surface overlay mode is opt-in via the declarative `data-xr-overlay` marker and is independent of any specific floating library. The SDK does not sniff floating-library internals to decide overlay mode.
- `data-xr-overlay` modifies a nested `enable-xr`; it does not replace `enable-xr`. Plain `enable-xr` means ordinary SpatialDiv content. `enable-xr data-xr-overlay` means floating UI content that needs a same-document measurement host plus a visible child surface.
- The SDK does not rewrite Radix `side`, `align`, `sideOffset`, or collision behavior.
- Scenario 1/2 Radix focus, keyboard navigation, outside click, and close behavior remain owned by Radix.
- Scenario 3 initially guarantees pointer/tap selection only. Keyboard navigation, focus, typeahead, focus trap, and outside-click dismissal are not in scope.
- Behavior without `enable-xr` remains unchanged.

### Scenario 1

- The menu rises as a spatial surface.
- The Radix popper in the main document remains measurable and non-zero.

### Scenario 2

- The menu renders inside the parent SpatialDiv's spatial window.
- The menu does not become an independent spatial surface.
- The menu can be constrained by the parent SpatialDiv's size and overflow like a normal web dropdown.

### Scenario 3

- The menu rises as a child SpatialDiv above or in front of the parent SpatialDiv.
- The menu is not clipped by the parent SpatialDiv's size, viewport, or overflow. It remains visible even when Radix positions it beyond the parent panel bounds.
- The child surface attaches to the parent SpatialDiv, not the scene root.
- The child menu follows when the parent panel moves.
- The child surface is destroyed when the menu closes.
- The floating UI trigger, positioning wrapper, and hidden measurement host remain measurable in the same parent spatial-window document. The visible popup content may render in a child SpatialDiv webview.

### Scenario 4 / 5

- `SpatialOverlay` exposes a measurement target and renders an inert copy of plugin content in the measurement render target.
- `SpatialOverlay` exposes the visible portal target and renders the real interactive plugin content in the portal render target.
- `portalMenuOption(content)` is sufficient for plugin systems that cannot pass a separate `measurementContent`.
- Nested SpatialDiv scenarios must not decide measurement vs. portal purely from `useSpatialPortalContainer()`. The SDK must distinguish placeholder/measurement rendering from visible portal rendering.

### Stretch Goal

- Radix `Portal` inside SpatialDiv content should eventually default to the nearest spatial window document body, allowing the ideal Scenario 3 path to omit `useSpatialPortalContainer()`.

## What Changes

### Phase A: Scenarios 1 And 2

- Document and demo Scenario 1.
- Deliver `useSpatialPortalContainer()` and `SpatialWindowContext`.
- Add the test-server demo for Scenario 1 and Scenario 2.

### Phase B: Scenario 3

- Make nested `enable-xr` with Radix satisfy the Scenario 3 guarantees above.
- Add the Scenario 3 demo panel in the target developer API shape.
- Keep implementation details in `design.md`.

### Phase C: Scenarios 4 And 5

- Add `SpatialOverlay` / `useSpatialOverlay()` for plugin-hosted menus.
- Add Scenario 4 and Scenario 5 demos.
- Add unit coverage for automatic measurement copies and nested render-target detection.

Breaking changes: none.

## Out Of Scope

- Rewriting Radix or Floating UI placement, collision, or focus management.
- Prebuilt wrappers for Popover, Tooltip, Dialog, or other floating UI libraries beyond the DropdownMenu demo.
- Making `spatialTransformMode=layout` the main path.

## Open Design Questions

1. How should nested `enable-xr` and same-document measurement constraints remain compatible over time across floating UI libraries?
2. How should native child SpatialDiv surfaces and parent spatial-window DOM divide responsibilities?
3. How should fixed-position floating layers attach to the parent SpatialDiv instead of the scene root?
4. How should child overlay surfaces remain visible outside the parent SpatialDiv's 2D rectangle while preserving parent-child spatial association?
5. Should automatic portal containers use context injection, thin library wrappers, or another approach?
6. What are the MVP limits for nesting depth, modal mode, and animations?
7. Should `SpatialOverlay` grow into a more general overlay primitive for Popover, Tooltip, and Dialog, or remain a low-level bridge API?

## Capabilities

- New: `spatial-overlay-portal-api` covers the Radix demo scenarios, the generalized Overlay SpatialDiv marker, and the SDK-level `SpatialOverlay` / `useSpatialOverlay` bridge API.
- Modified: none.

## Delivery

Phase A, Phase B, and Phase C belong to this OpenSpec change. They may ship as separate PRs. Phase A can merge after its own tasks pass. Phase B and Phase C do not require a separate change ID.
