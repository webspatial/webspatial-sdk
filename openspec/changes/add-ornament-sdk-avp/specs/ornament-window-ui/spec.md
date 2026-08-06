# Ornament window UI

## ADDED Requirements

### Requirement: Expose the finalized React Ornament component API

The WebSpatial SDK MUST expose Ornament in `@webspatial/react-sdk` through a declarative `<Ornament />` component.

#### Scenario: Component mount flow

- **WHEN** application code renders `<Ornament>{content}</Ornament>` in a supported runtime
- **THEN** the SDK MUST create a window-level Ornament using documented defaults, attach it to the current scene, and portal `content` into the Ornament container

#### Scenario: Component update flow

- **WHEN** `attachmentAnchor`, `contentAlignment`, `visibility`, `width`, `height`, `cornerRadius`, or `backgroundMaterial` props change
- **THEN** the SDK MUST normalize the new props and update the existing runtime Ornament instance

#### Scenario: Component unmount flow

- **WHEN** the `<Ornament />` component unmounts
- **THEN** the SDK MUST clean up portal content and destroy the matching runtime Ornament instance

#### Scenario: Public API fields

- **WHEN** developers render `<Ornament />`
- **THEN** the supported public props MUST be `attachmentAnchor`, `contentAlignment`, `visibility`, `width`, `height`, `cornerRadius`, `backgroundMaterial`, and `children`

#### Scenario: Host appearance props

- **WHEN** developers set `cornerRadius` or `backgroundMaterial`
- **THEN** the SDK MUST pass those values through create and update paths
- **AND** AVP host rendering MUST apply the resulting background material and rounded-corner clipping to the Ornament content container

### Requirement: Return null in unsupported runtimes

The React SDK MUST NOT provide fallback rendering for Ornament in unsupported runtimes.

#### Scenario: Unsupported runtime

- **WHEN** the current runtime does not support Ornament
- **THEN** `<Ornament />` MUST return `null`
- **AND** it MUST NOT render `children` into the normal DOM tree
- **AND** it MUST NOT create a 2D overlay or fallback portal

### Requirement: Propagate page CSS into Ornament content

The React SDK MUST render Ornament content with the same page style propagation expectations as SpatialDiv portal content.

#### Scenario: Global styles and CSS variables

- **WHEN** Ornament content depends on page-level CSS rules or CSS variables
- **THEN** those styles MUST be available in the Ornament content container through the shared style/head synchronization model

#### Scenario: CSS-in-JS styles

- **WHEN** Ornament content depends on runtime-injected style tags
- **THEN** the SDK SHOULD synchronize those style tags using the same mechanism used by SpatialDiv portals

### Requirement: Reject nested Ornament declarations in MVP

The React SDK MUST NOT support declaring `<Ornament />` inside another Ornament's content tree in the MVP.

#### Scenario: Nested declaration in development

- **WHEN** an `<Ornament />` is declared inside another `<Ornament />` content tree in development
- **THEN** the SDK SHOULD emit a warning explaining that nested Ornament declarations are not supported
- **AND** the nested declaration MUST NOT create a native Ornament instance

#### Scenario: Nested declaration in production

- **WHEN** an `<Ornament />` is declared inside another `<Ornament />` content tree in production
- **THEN** the nested declaration MUST NOT create a native Ornament instance

### Requirement: Prevent nested spatial primitive creation inside Ornament content

The React SDK MUST treat Ornament content as a window-level DOM portal and MUST NOT create nested native WebSpatial spatial instances from spatial primitive declarations inside that portal.

#### Scenario: SpatialDiv marker inside Ornament content

- **WHEN** Ornament content renders an element with the `enable-xr` spatial marker or equivalent SpatialDiv marker path
- **THEN** the SDK MUST NOT create a nested `Spatialized2DElement`
- **AND** the element SHOULD degrade to plain DOM with spatial-only props stripped
- **AND** development builds SHOULD emit a warning explaining that SpatialDiv content is not supported inside Ornament content

#### Scenario: Model inside Ornament content

- **WHEN** Ornament content renders `<Model />`
- **THEN** the SDK MUST NOT create a native WebSpatial spatial Model instance
- **AND** the component SHOULD degrade to the native `<model>` fallback
- **AND** development builds SHOULD emit a warning explaining that spatial Model content is not supported inside Ornament content

#### Scenario: Reality inside Ornament content

- **WHEN** Ornament content renders `<Reality />`
- **THEN** the SDK MUST NOT create a Reality root or mount the Reality child subtree
- **AND** the component MUST render `null`
- **AND** development builds SHOULD emit a warning explaining that Reality content is not supported inside Ornament content

#### Scenario: Ornament inside Attachment content

- **WHEN** Attachment content renders `<Ornament />`
- **THEN** the SDK MUST NOT create a native Ornament instance
- **AND** development builds SHOULD emit a warning explaining that Ornament content is not supported inside Attachment content

### Requirement: Provide an Ornament test-server demo

The SDK MUST include an `apps/test-server` demo page that exercises the public `<Ornament />` API for manual validation and automated test reuse.

#### Scenario: Demo exposes Ornament prop controls

- **WHEN** a developer opens the Ornament demo page
- **THEN** the page MUST expose a list of Ornament items
- **AND** the page MUST expose top-level Add and Remove controls for dynamically adding or removing Ornament items
- **AND** each list item MUST expose controls for `attachmentAnchor`, `contentAlignment`, `visibility`, `width`, `height`, `cornerRadius`, and `backgroundMaterial`
- **AND** changing those controls MUST update the rendered `<Ornament />` props without using private Ornament helpers

#### Scenario: Demo removes diagnostics panel

- **WHEN** a developer opens the Ornament demo page
- **THEN** the page MUST NOT require a separate diagnostics panel for current prop values
- **AND** the editable list items MUST be the primary manual inspection surface

#### Scenario: Demo exposes normal DOM content

- **WHEN** the demo renders the normal DOM content mode
- **THEN** Ornament content SHOULD visibly depend on page-level CSS and CSS variables so style/head propagation can be inspected

#### Scenario: Demo exposes degraded spatial primitive content

- **WHEN** a demo Ornament item switches content mode to `enable-xr`, `Model`, or `Reality`
- **THEN** the page MUST render those declarations inside Ornament content

#### Scenario: Demo provides stable test hooks

- **WHEN** automated tests or device smoke flows use the demo
- **THEN** the page MUST provide stable selectors or equivalent test hooks for the list, Add/Remove buttons, item controls, selected content mode, and lifecycle behavior

### Requirement: Provide core Ornament runtime object

The WebSpatial SDK MUST provide a core runtime Ornament abstraction that is independent of `Attachment` and scene entities.

#### Scenario: Create Ornament

- **WHEN** the React layer requests Ornament creation
- **THEN** the core runtime MUST allocate an Ornament runtime object, request a native container, and return `id + windowProxy`

#### Scenario: Return portal container

- **WHEN** ornament creation succeeds
- **THEN** the runtime MUST return a `windowProxy` or equivalent container handle usable by React portal rendering

#### Scenario: Add Ornament to scene

- **WHEN** the React layer wants the Ornament to become visible in the host
- **THEN** the runtime MUST attach it through `SpatialScene.addOrnament(id)`

#### Scenario: Update Ornament

- **WHEN** `attachmentAnchor`, `contentAlignment`, `visibility`, `width`, `height`, `cornerRadius`, or `backgroundMaterial` changes
- **THEN** the runtime MUST propagate the updated values to the native host

#### Scenario: Destroy Ornament

- **WHEN** the Ornament instance is destroyed
- **THEN** the runtime MUST release the object mapping and native container resources

### Requirement: Support capability detection for Ornament

The WebSpatial SDK MUST expose a documented capability check for Ornament support.

#### Scenario: Supported runtime

- **WHEN** the current runtime supports Ornament
- **THEN** the capability check MUST report support

#### Scenario: Unsupported runtime

- **WHEN** the current runtime does not support Ornament
- **THEN** the capability check MUST report no support and prevent runtime Ornament creation from starting

### Requirement: Normalize Ornament input values

The WebSpatial SDK MUST normalize Ornament input values before they reach the native host.

#### Scenario: Top-center attachment fallback

- **WHEN** `attachmentAnchor` is `topFront`, `top`, or `topBack`
- **THEN** the runtime MUST treat it as invalid input and fall back to `bottom`

#### Scenario: Full content alignment support

- **WHEN** `contentAlignment` is any valid value in the shared 27-point family
- **THEN** the runtime MUST accept it, including top-related values

#### Scenario: Invalid content alignment

- **WHEN** `contentAlignment` is missing or invalid
- **THEN** the runtime MUST fall back to `back`

#### Scenario: Invalid size or visibility

- **WHEN** `visibility`, `width`, or `height` is missing or invalid
- **THEN** the runtime MUST apply documented default values rather than passing invalid state to the host

#### Scenario: Invalid appearance options

- **WHEN** `cornerRadius` or `backgroundMaterial` is missing or invalid
- **THEN** the runtime MUST apply documented default values rather than passing invalid state to the host

### Requirement: Preserve create request correlation and page isolation

The WebSpatial SDK MUST reuse spatial request metadata for Ornament container creation.

#### Scenario: Create request carries rid

- **WHEN** the SDK opens the native Ornament container request
- **THEN** the protocol URL MUST include a unique `rid`

#### Scenario: Create request carries page epoch

- **WHEN** the current page epoch exists
- **THEN** the protocol URL MUST include `wsepoch`

#### Scenario: Stale create response

- **WHEN** an Ornament create response belongs to an obsolete page epoch
- **THEN** the runtime MUST prevent that response from attaching an Ornament to the current page

### Requirement: Provide AVP ornament host integration

The AVP host in `packages/visionOS` MUST render Ornament instances through SwiftUI `.ornament(...)`.

#### Scenario: Host access direction

- **WHEN** the host renders Ornament state
- **THEN** it MUST read active ornaments through `SpatialScene`, not by directly coupling the host layer to low-level model internals

#### Scenario: Attachment anchor mapping

- **WHEN** a public `attachmentAnchor` value is provided
- **THEN** the AVP host MUST map it to `.scene(UnitPoint3D)`

#### Scenario: Multiple ornaments

- **WHEN** multiple Ornament instances exist in the same window
- **THEN** the AVP host MUST allow coexistence and preserve native creation-order stacking semantics where earlier-created overlapping instances remain above later-created instances

#### Scenario: Navigation coexistence

- **WHEN** `SpatialNavView` and Web Ornament instances exist together
- **THEN** the host MUST manage them in the same window-scene host layer without corrupting either one

#### Scenario: Inspect visibility

- **WHEN** scene inspect output is requested
- **THEN** Ornament host statistics MUST be surfaced through the existing scene inspect path

### Requirement: Provide automated regression coverage

The SDK MUST include automated tests for the Ornament runtime contract in `packages/autoTest`.

#### Scenario: Creation and defaults

- **WHEN** automated tests run the Ornament test page
- **THEN** they MUST verify successful component-driven creation and documented default behavior

#### Scenario: Add, remove, update, and visibility

- **WHEN** automated tests trigger component mount, unmount, prop updates, or `visibility` changes
- **THEN** they MUST verify that runtime behavior reflects the transitions

#### Scenario: Destroy behavior

- **WHEN** automated tests unmount an Ornament component
- **THEN** they MUST verify that the runtime releases the instance and its associated container state

#### Scenario: Multiple instances

- **WHEN** automated tests create multiple Ornament instances
- **THEN** they MUST verify basic coexistence and ordering behavior

#### Scenario: CSS propagation

- **WHEN** automated tests render styled content inside Ornament
- **THEN** they MUST verify that page-level styling is available in the Ornament container

#### Scenario: Unsupported runtime and nested declarations

- **WHEN** automated tests run unsupported-runtime or nested-declaration cases
- **THEN** they MUST verify null/no-op behavior and development diagnostics where applicable

#### Scenario: Spatial primitives inside Ornament content

- **WHEN** automated tests render `enable-xr`, `Model`, or `Reality` declarations inside Ornament content
- **THEN** they MUST verify that no nested native spatial instances are created
- **AND** they MUST verify the documented degradation behavior for each primitive

#### Scenario: Test-server demo reuse

- **WHEN** automated tests need an interactive Ornament scenario
- **THEN** they SHOULD reuse the Ornament test-server demo instead of creating a separate one-off fixture when the demo already covers the required behavior
