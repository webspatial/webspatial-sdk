## ADDED Requirements

### Requirement: Main-page Radix floating content can spatialize via `div enable-xr`

The SDK documentation and demo SHALL show a main-page Radix `DropdownMenu` integration where:

- `DropdownMenu.Portal` targets the main app portal host (for example `document.body` or `#root`);
- `DropdownMenu.Content` uses `asChild`;
- the child is a `div` with `enable-xr` and spatial CSS variables (`--xr-back`, `--xr-depth`, `--xr-background-material`).

WebSpatial SHALL preserve the third-party floating library's final DOM positioning. The SDK MUST NOT reinterpret side, align, offset, or collision options.

#### Scenario: Radix DropdownMenu.Content composes with inner enable-xr host

- **WHEN** an application renders `DropdownMenu.Content asChild`
- **AND** the child is a `div enable-xr`
- **THEN** the dropdown content SHALL rise as a spatial surface without modifying Radix internals

#### Scenario: API is additive

- **WHEN** an application does not use `enable-xr` on floating content
- **THEN** existing SpatialDiv, Model, Reality, and normal DOM rendering behavior SHALL remain unchanged

### Requirement: SpatialDiv-local Radix menus portal to the spatial window

The React SDK SHALL expose `useSpatialPortalContainer()` returning the nearest spatial window document body for use as a Radix `Portal container`.

`Spatialized2DElementContainer` SHALL provide the spatial window through `SpatialWindowContext`.

In degraded mode (no WebSpatial session; `enable-xr` renders as plain HTML), `DegradedContainer` SHALL provide the host page `window` through `SpatialWindowContext` so descendants can still call `useSpatialPortalContainer()` without an app-level fallback.

#### Scenario: Flat menu inside SpatialDiv

- **WHEN** a Radix `DropdownMenu` trigger and content both render inside SpatialDiv portal content
- **AND** `DropdownMenu.Portal container={useSpatialPortalContainer()}`
- **THEN** the menu SHALL render in the same spatial window as ordinary 2D DOM
- **AND** the menu content SHALL NOT require `enable-xr`

#### Scenario: Degraded SpatialDiv exposes host portal container

- **WHEN** a Radix `DropdownMenu` renders inside a degraded `enable-xr` subtree
- **AND** `DropdownMenu.Portal container={useSpatialPortalContainer()}`
- **THEN** the hook SHALL return the host document body
- **AND** the menu SHALL portal to the same document as the visible trigger

#### Scenario: Hook outside spatial context

- **WHEN** `useSpatialPortalContainer()` is called outside any SpatialDiv subtree (no `SpatialWindowContext` provider above)
- **THEN** it SHALL return `undefined`
- **AND** applications SHALL fall back to their default portal target (for example `document.body` on the main page)

### Requirement: SpatialDiv child floating menu can escape parent bounds

Inside a parent `div enable-xr`, an application SHALL be able to open a Radix `DropdownMenu` whose floating content is a **child SpatialDiv** (`div enable-xr` via `DropdownMenu.Content asChild`) attached to the parent SpatialDiv.

The child floating menu SHALL appear above or in front of the parent SpatialDiv and SHALL NOT be clipped by the parent SpatialDiv's 2D viewport, width, height, or overflow bounds. This is the core behavior that differentiates Scenario 3 from a SpatialDiv-local flat menu.

The ideal developer path SHALL require only nested `enable-xr` and Radix — no Scenario-3-specific hooks.

Until auto portal routing ships, applications MAY pass `DropdownMenu.Portal container={useSpatialPortalContainer()}` as interim plumbing shared with Scenario 2.

#### Scenario: Child SpatialDiv menu inside parent SpatialDiv

- **WHEN** an application renders a parent `div enable-xr` containing a Radix `DropdownMenu`
- **AND** `DropdownMenu.Content asChild` wraps a child `div enable-xr` with spatial CSS variables
- **THEN** the menu SHALL rise above or in front of the parent SpatialDiv as a child spatial surface attached to the parent SpatialDiv
- **AND** the menu SHALL NOT attach to scene root

#### Scenario: Child floating menu escapes parent 2D bounds

- **WHEN** Radix positions the Scenario 3 menu so that its final rect extends beyond the parent SpatialDiv's 2D width, height, viewport, or overflow area
- **THEN** the visible child SpatialDiv menu SHALL remain complete and visible outside the parent bounds
- **AND** the parent SpatialDiv SHALL NOT clip the visible menu surface

#### Scenario: Radix measurement host remains measurable in parent spatial window

- **WHEN** the Scenario 3 menu is open
- **THEN** Radix trigger, popper wrapper, and the SDK-provided hidden measurement host SHALL remain in the same parent spatial-window document
- **AND** the hidden measurement host SHALL receive the Radix `asChild` props/ref and menu children needed for measurement
- **AND** the popper wrapper SHALL NOT be 0×0 due to cross-document or cross-webview DOM splitting
- **AND** the visible menu content MAY render in a child SpatialDiv webview

#### Scenario: Child surface lifecycle

- **WHEN** the Radix menu opens
- **THEN** the SDK SHALL create the child SpatialDiv surface
- **WHEN** the Radix menu closes or the host unmounts
- **THEN** the SDK SHALL destroy the child surface

#### Scenario: Child surface follows parent SpatialDiv

- **WHEN** the parent SpatialDiv moves or repositions in space
- **AND** the Scenario 3 menu is open
- **THEN** the child SpatialDiv menu SHALL remain correctly associated with the parent

#### Scenario: Radix positioning preserved for child surface

- **WHEN** Radix applies side, align, offset, or collision adjustments to the floating host
- **THEN** WebSpatial SHALL not reimplement floating layout; the visible child surface SHALL reflect Radix's final positioned rect

#### Scenario: Auto portal container (stretch goal)

- **WHEN** a Radix `DropdownMenu` renders inside SpatialDiv portal content without an explicit `Portal container`
- **THEN** the SDK SHOULD default the portal target to the nearest spatial window document body

### Requirement: Scenario 3 menu supports pointer selection

The floating content measurement host SHALL remain a real DOM element measurable by Radix in the parent spatial-window document.

Pointer/tap selection (`onSelect`) SHALL be handled by Radix.

Keyboard navigation, typeahead, focus management, focus trapping, and outside-click dismissal are explicitly **NOT requirements** of this change for Scenario 3. The SDK does not need to make these Radix interaction semantics work across the parent spatial window and the child surface.

#### Scenario: Radix menu pointer selection works

- **WHEN** a Radix dropdown menu item is selected via pointer/tap
- **THEN** Radix SHALL receive the selection and fire `onSelect`

### Requirement: Acceptance test matrix

Automated or demo verification SHALL cover at minimum:

- `useSpatialPortalContainer()` returns the spatial window body when provided by context.
- Demo page shows Scenario 1 (main-page `div enable-xr` menu), Scenario 2 (SpatialDiv flat menu), and Scenario 3 (nested `enable-xr` child SpatialDiv menu + Radix).

#### Scenario: CI and demo cover all in-scope scenarios

- **WHEN** tests and demo verification run for this change
- **THEN** they SHALL cover a main-page floating spatial menu, a SpatialDiv-local flat menu, and a SpatialDiv child SpatialDiv floating menu that can escape parent bounds

#### Scenario: Phase A can verify independently

- **WHEN** Scenario 3 implementation is not yet complete
- **THEN** Phase A tasks (Scenarios 1 and 2) SHALL remain verifiable without Scenario 3 deliverables
