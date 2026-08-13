## 1. Core runtime and scene lifecycle

- [x] 1.1 Add `OrnamentPoint3D`, `OrnamentVisibility`, `OrnamentOptions`, and `Ornament extends SpatialObject`
- [x] 1.2 Add `SpatialSession.createOrnament(options)` and `SpatialScene.addOrnament(id)` APIs
- [x] 1.3 Wire `createOrnament` through the `window.open` protocol path and keep `AddOrnamentToScene`, `UpdateOrnament`, and `Destroy` on the JSB command path
- [x] 1.4 Reuse the existing `window.open -> callWebSpatialProtocol` path so create returns `id + windowProxy + container`
- [x] 1.5 Reuse `createSpatialRequestId()` and `buildSpatialRequestQuery(...)` so `createOrnament` carries `rid` and `wsepoch`
- [x] 1.7 Add shared input normalization for defaults, invalid enum recovery, and `topFront` / `top` / `topBack` attachment fallback to `bottom`
- [x] 1.8 Add `WebSpatialRuntime.supports('Ornament')`

## 2. React component API

- [x] 2.1 Add public `OrnamentProps` and `<Ornament />` component export
- [x] 2.2 Implement mount flow as `capability check -> create -> add -> portal mount`
- [x] 2.3 Return `null` without rendering children when Ornament is unsupported
- [x] 2.4 Use returned `windowProxy.document.body` or equivalent container as the portal mount target for `children`
- [x] 2.5 Implement prop updates against `Ornament.update(...)` with latest normalized props
- [x] 2.6 Implement unmount cleanup that removes portal content and destroys the runtime Ornament
- [x] 2.7 Add component-local disposed/latest-props guards for async create races and React StrictMode behavior
- [x] 2.8 Add MVP nested Ornament detection so nested declarations warn in development and do not create native instances
- [x] 2.9 Add an Ornament portal boundary context, aligned with `AttachmentAsset`, so spatial primitives can detect when they are rendering inside Ornament content
- [x] 2.10 Make `enable-xr` / SpatialDiv content inside Ornament warn in development and degrade to plain DOM without creating `Spatialized2DElement`
- [x] 2.11 Make `Model` inside Ornament warn in development and degrade to the native `<model>` fallback without creating a spatial Model instance
- [x] 2.12 Make `Reality` inside Ornament warn in development and render `null` without creating a Reality root or mounting its child subtree

## 3. CSS and portal style propagation

- [x] 3.1 Reuse SpatialDiv portal style/head synchronization for Ornament content
- [x] 3.2 Verify global CSS and CSS variables are available inside Ornament content
- [x] 3.3 Verify CSS-in-JS injected style tags are synchronized into the Ornament content document
- [x] 3.4 Avoid introducing a separate Ornament-only CSS propagation path unless SpatialDiv reuse is technically impossible

## 4. AVP host integration

- [x] 4.1 Define `OrnamentElement`, `OrnamentManager`, a `SpatialObject` registry, active host state, and viewModel ownership
- [x] 4.2 Expose active Ornament state through `SpatialScene` and forward model changes to the host layer
- [x] 4.3 Introduce `OrnamentHost` around `SpatialSceneContentView.swift`
- [x] 4.4 Map `attachmentAnchor` to `.scene(UnitPoint3D)` and `contentAlignment` to `Alignment3D`
- [x] 4.5 Attach native container views with size and visibility handling
- [x] 4.6 Preserve AVP stacking semantics so earlier-created overlapping instances remain above later-created ones
- [x] 4.7 Ensure coexistence with built-in `SpatialNavView`
- [x] 4.8 Surface Ornament inspect statistics through the existing scene inspect path

## 5. Automated validation

- [x] 5.1 Add an Ornament runtime-contract test entry under `packages/autoTest`
- [x] 5.2 Reuse the `apps/test-server` Ornament demo for interactive runtime-contract coverage where possible
- [x] 5.3 Add stable selectors and triggers for component mount, prop update, unmount, hidden-state assertions, and unsupported-runtime null rendering
- [x] 5.4 Add tests for defaults and invalid-value recovery
- [x] 5.5 Add tests for CSS propagation from parent page context into Ornament content
- [x] 5.6 Add tests for nested Ornament warning/no-op behavior
- [x] 5.7 Add tests for `enable-xr`, `Model`, and `Reality` inside Ornament content, verifying Attachment-aligned degradation and no nested native spatial instance creation
- [x] 5.8 Add tests for multi-instance coexistence and AVP ordering expectations
- [x] 5.9 Add tests or mocks covering `rid + wsepoch` propagation for `createOrnament`
- [x] 5.10 Run through the existing `PuppeteerRunner + mocha` pipeline

## 6. Test-server demo

- [x] 6.1 Add an `apps/test-server` Ornament demo route and sidebar entry.
- [x] 6.2 Render Ornament controls as a list where each item binds `attachmentAnchor`, `contentAlignment`, `visibility`, `width`, and `height` to one public `<Ornament />`.
- [x] 6.3 Add list-level Add and Remove controls so lifecycle creation and cleanup can be manually verified.
- [x] 6.4 Add content-mode controls for normal DOM, `enable-xr` / SpatialDiv marker, `Model`, `Reality`, and a mixed compatibility view.
- [x] 6.5 Make the normal DOM mode visibly depend on page-level CSS and CSS variables so Ornament style inheritance can be inspected.
- [x] 6.6 Remove the separate diagnostics panel so the editable list items are the manual inspection surface.
- [x] 6.7 Add stable selectors or test ids for the list, Add/Remove buttons, item controls, and content modes so `packages/autoTest` and device smoke flows can reuse the demo.

## 7. Appearance options

- [x] 7.1 Add `cornerRadius` and `backgroundMaterial` to core and React Ornament options, including create/update serialization.
- [x] 7.2 Apply `cornerRadius` and `backgroundMaterial` in the AVP Ornament host.
- [x] 7.3 Add per-item test-server controls and automated contract coverage for appearance updates.
