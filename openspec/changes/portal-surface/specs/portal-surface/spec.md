## ADDED Requirements

### Requirement: React SDK exposes PortalSurface

The React SDK SHALL expose a public `PortalSurface` component for rendering modal-like overlay subtrees inside a raised 2D spatial surface.

`PortalSurface` MUST be an additive API. Existing `SpatialDiv`, `SpatialOverlay`, `Model`, `Reality`, and ordinary DOM behavior MUST remain unchanged when applications do not render `PortalSurface`.

The minimum public props SHALL include:

- `children?: React.ReactNode`
- `zOffset?: number | string`
- `backgroundMaterial?: BackgroundMaterialType`

The component SHOULD NOT expose host DOM styling props in the first release.

#### Scenario: Basic PortalSurface render

- **WHEN** an application renders `<PortalSurface zOffset={100}>content</PortalSurface>` in a WebSpatial runtime
- **THEN** the SDK SHALL render `content` inside a raised 2D spatial surface
- **AND** the raised surface SHALL be positioned in front of the main webview according to `zOffset`

#### Scenario: Additive API

- **WHEN** an application does not render `PortalSurface`
- **THEN** existing SpatialDiv, SpatialOverlay, Model, Reality, and ordinary DOM rendering behavior SHALL remain unchanged

### Requirement: PortalSurface renders children in the raised document

`PortalSurface` SHALL render its children into the child spatial webview document associated with the raised surface, not merely wrap an already-rendered host-page DOM fragment.

The child subtree SHALL be rendered under the raised surface document body or an equivalent root inside that document. Component-local DOM relationships inside the subtree SHALL remain in that raised document.

#### Scenario: Modal DOM is document-local inside PortalSurface

- **WHEN** a modal component renders wrapper, mask, dialog, body, footer, and close button inside `PortalSurface`
- **THEN** those modal nodes SHALL be created in the raised surface document
- **AND** component-local selectors whose required ancestors are inside the modal subtree SHALL be able to match in that document

#### Scenario: PortalSurface is not a modalRender wrapper

- **WHEN** a modal component is passed as a child of `PortalSurface`
- **THEN** the SDK SHALL NOT rely on receiving an already-rendered modal DOM fragment from the modal library's `modalRender` callback as the primary spatialization mechanism

#### Scenario: PortalSurface inside SpatialDiv creates one raised surface

- **WHEN** `PortalSurface` is rendered as a descendant of a `SpatialDiv`
- **THEN** the hidden standard-instance copy SHALL NOT create a `PortalSurface` webview
- **AND** the visible portal-instance copy SHALL create the `PortalSurface` webview
- **AND** each mounted `PortalSurface` subtree SHALL own at most one raised surface webview

### Requirement: PortalSurface defaults to viewport-sized overlay semantics

`PortalSurface` SHALL create a raised surface whose default box matches the main webview viewport for modal-like overlay use cases.

The raised document body or root SHALL provide a viewport-like coordinate system suitable for fixed, centered, or full-screen overlay layouts. The surface background SHALL be transparent unless application styles or props provide a visible background.

#### Scenario: Viewport-sized surface

- **WHEN** `PortalSurface` is rendered with default sizing
- **THEN** the measured 2D spatial host used to size the raised surface SHALL cover the main viewport
- **AND** children inside the raised document SHALL be able to use viewport-relative modal layout

#### Scenario: Transparent raised document background

- **WHEN** `PortalSurface` is rendered without an explicit background
- **THEN** the raised document body/root SHALL NOT introduce an opaque default background over the main webview

### Requirement: PortalSurface provides spatial portal container context

Children rendered inside `PortalSurface` SHALL be able to call `useSpatialPortalContainer()` and receive the raised surface document body.

Applications and component adapters SHALL use that container for nested UI-library portals when same-document DOM is required. The SDK MUST document that libraries which ignore this container and read the host page `document.body` directly may still portal content outside the raised surface.

#### Scenario: Nested modal portal target is the raised document

- **WHEN** a child component inside `PortalSurface` calls `useSpatialPortalContainer()`
- **THEN** the hook SHALL return the raised surface document body

#### Scenario: Modal adapter uses the spatial portal container

- **WHEN** a modal adapter passes `useSpatialPortalContainer()` to the modal library's container prop
- **THEN** the modal library's internally portaled wrapper, mask, dialog, and footer SHALL render in the raised surface document
- **AND** close, cancel, or confirm handlers SHALL be able to update React state in the host application tree

### Requirement: PortalSurface reuses SpatialDiv style synchronization

`PortalSurface` SHALL reuse the existing SpatialDiv host-to-portal style synchronization path for raised child documents.

The SDK SHALL sync the ordinary style sources already supported by SpatialDiv portal documents, including host `document.head` stylesheets, inline style tags, CSSOM updates from CSS-in-JS runtimes, and common document-element class/style inheritance handled by the existing style sync.

`PortalSurface` MUST NOT claim to recreate arbitrary host-page ancestor DOM context. Selectors that depend on ancestors outside the raised document are outside the first-release styling contract.

#### Scenario: Stylesheet and style tag rules apply in raised document

- **WHEN** component styles are present in host `document.head` as linked stylesheets or style tags
- **AND** a component renders inside `PortalSurface`
- **THEN** those style rules SHALL be mirrored into the raised document using the existing SpatialDiv style sync path

#### Scenario: CSS-in-JS head updates are mirrored

- **WHEN** a CSS-in-JS runtime updates host `document.head` through style text or CSSOM rule changes
- **AND** `PortalSurface` is mounted
- **THEN** the SDK SHALL mirror the update into the raised document according to the existing portal head-sync behavior

#### Scenario: Host ancestor selectors are not guaranteed

- **WHEN** a style rule depends on a host-page ancestor that is not rendered inside `PortalSurface`
- **THEN** the SDK SHALL NOT guarantee that the rule matches inside the raised document
- **AND** applications SHOULD express those styles through component-local selectors, CSS variables, or explicit classes rendered inside `PortalSurface`

### Requirement: PortalSurface supports pointer close and confirm flows

`PortalSurface` SHALL support pointer/click interaction for modal-like UI rendered inside the raised document.

React event handlers attached to descendants of `PortalSurface` SHALL be able to update state owned by the host React tree.

#### Scenario: Close button updates host state

- **WHEN** a controlled modal inside `PortalSurface` renders a close button
- **AND** the user clicks that button in a WebSpatial runtime
- **THEN** the modal's close handler SHALL run
- **AND** the host application SHALL be able to update state so the modal is no longer visible

#### Scenario: Confirm button updates host state

- **WHEN** a controlled modal inside `PortalSurface` renders a confirm button
- **AND** the user clicks that button in a WebSpatial runtime
- **THEN** the confirm handler SHALL run
- **AND** the host application SHALL be able to update state

### Requirement: PortalSurface defines degraded plain-web behavior

When WebSpatial runtime is unavailable or before spatial readiness, `PortalSurface` SHALL degrade to plain React DOM in the current document.

In degraded mode, the default-entry `useSpatialPortalContainer()` hook SHALL return the host document body directly without requiring an extra provider.

Spatial-only attributes or internal props MUST NOT leak to the rendered DOM.

#### Scenario: Plain-web fallback renders children

- **WHEN** WebSpatial runtime is unavailable
- **AND** an application renders `PortalSurface`
- **THEN** the children SHALL render in the host document as ordinary React DOM

#### Scenario: Plain-web fallback provides host portal container

- **WHEN** a descendant of degraded `PortalSurface` calls `useSpatialPortalContainer()`
- **THEN** the hook SHALL return the host document body

#### Scenario: Spatial-only props do not leak

- **WHEN** `PortalSurface` renders in degraded mode
- **THEN** spatial-only implementation props and attributes SHALL NOT appear as real DOM attributes

### Requirement: PortalSurface is distinct from SpatialOverlay

`PortalSurface` SHALL be documented as an app-level raised document surface for modal-like UI.

`SpatialOverlay` SHALL remain the SDK bridge for floating UI or plugin content that needs measurement and visible portal targets inside an existing floating surface. `PortalSurface` MUST NOT replace or change the semantics of `SpatialOverlay`, `useSpatialOverlay()`, or the `data-xr-overlay` marker.

#### Scenario: SpatialOverlay behavior remains unchanged

- **WHEN** an application uses `SpatialOverlay`, `useSpatialOverlay()`, or `div enable-xr data-xr-overlay`
- **THEN** the SDK SHALL preserve the existing floating UI and plugin-host behavior
- **AND** `PortalSurface` SHALL NOT be required for those APIs to work

#### Scenario: PortalSurface owns a full overlay surface

- **WHEN** an application needs a modal-like UI with a complete wrapper/mask/dialog document structure
- **THEN** `PortalSurface` SHALL be the recommended primitive instead of `SpatialOverlay`

### Requirement: PortalSurface verification coverage

The implementation SHALL include automated tests for public API exposure, degraded behavior, spatial portal container context, and style-sync integration boundaries.

The implementation SHALL include an interactive test-server demo or equivalent manual verification path for a controlled modal inside `PortalSurface`.

#### Scenario: Automated tests cover the core contract

- **WHEN** the React SDK test suite runs for this change
- **THEN** it SHALL include coverage for `PortalSurface` public exports, degraded rendering, `useSpatialPortalContainer()` inside `PortalSurface`, and no DOM leakage of spatial-only props

#### Scenario: Manual modal smoke path exists

- **WHEN** a developer runs the test-server demo for `PortalSurface`
- **THEN** they SHALL be able to open a modal rendered inside `PortalSurface`
- **AND** verify that the modal is raised, styled, and closable through pointer interaction
