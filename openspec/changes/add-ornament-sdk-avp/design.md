## Context

This change adds the finalized Ornament capability to the `webspatial-sdk` repository. Ornament is a scene-scoped, window-level runtime object. It is not a `Reality Attachment`, not a scene-entity child, and not a normal DOM layout primitive.

The implementation scope for this change remains limited to:

- `packages/core`
- `packages/react`
- `packages/visionOS`
- `packages/autoTest`

PicoOS/native hosting and `Augment(...)` mapping remain intentionally split into the native OpenSpec change. Native shell handoff remains a request-metadata validation path rather than the formal Ornament runtime owner.

## Goals / Non-Goals

**Goals**

- Expose the finalized React Ornament API as a declarative `<Ornament />` component.
- Map React component lifecycle to core runtime lifecycle.
- Add a scene-scoped core runtime Ornament abstraction with `create / add / update / destroy`.
- Reuse the existing `window.open -> windowProxy` protocol path for Ornament container creation.
- Reuse existing spatial request metadata (`rid + wsepoch`) for `createOrnament` request correlation and page-epoch isolation.
- Reuse the SpatialDiv style/head propagation model so Ornament content inherits page CSS.
- Support host appearance updates for rounded corners and background material through `cornerRadius` and `backgroundMaterial`.
- Align Ornament-content spatial primitive boundaries with `AttachmentAsset`: nested `enable-xr` content degrades to plain DOM, `Model` degrades to `<model>`, and `Reality` renders `null` instead of creating nested native spatial instances.
- Add AVP host support through `OrnamentHost -> SpatialScene -> OrnamentManager -> OrnamentElement`.
- Add capability detection through `WebSpatialRuntime.supports('Ornament')`.
- Add an `apps/test-server` Ornament demo page for manual exploration and automated test reuse.
- Define contract-level regression coverage through `packages/autoTest`.

**Non-Goals**

- PicoOS/native runtime implementation.
- Hook-style `useOrnament() + mountOrnament(...)` as the final public developer API.
- React-side fallback rendering, browser overlay, or 2D portal behavior for unsupported runtimes.
- Supporting nested `<Ornament />` declarations inside Ornament content in the MVP.
- Supporting nested native spatial content creation from Ornament content, including nested SpatialDiv, native spatial Model, or Reality roots.
- AVP `.parent(UnitPoint3D)` exposure.
- PicoOS-only `rotation3D` and `followViewpoints` controls.
- Modeling Ornament as `Attachment` or a `SpatializedElement` child.

## Decisions

1. **Final React API shape**

   - Final public surface:
     - `function Ornament(props: OrnamentProps): React.ReactElement | null`
   - Public props:
     - `attachmentAnchor?: OrnamentPoint3D`
     - `contentAlignment?: OrnamentPoint3D`
     - `visibility?: 'visible' | 'hidden'`
     - `width?: number`
     - `height?: number`
     - `cornerRadius?: CornerRadius`
     - `backgroundMaterial?: BackgroundMaterialType`
     - `children: React.ReactNode`
   - Hook-style APIs may exist as internal helpers only if implementation needs them, but they are not the primary public contract.

2. **Component lifecycle mapping**

   - On mount, React checks `WebSpatialRuntime.supports('Ornament')`.
   - Unsupported runtimes return `null` and do not render `children` anywhere.
   - Supported runtimes run `create -> add -> portal mount`.
   - Props changes call `Ornament.update(...)` with normalized options.
   - Component unmount cleans up the portal and destroys the runtime Ornament.
   - `visibility='hidden'` updates native visibility only; it does not unmount or destroy the instance.

3. **CSS propagation**

   - Ornament content must inherit the page styling environment.
   - Implementation should reuse the existing SpatialDiv portal style/head synchronization path instead of creating a separate Ornament-only CSS system.
   - Expected coverage includes global CSS, CSS variables, theme classes, and CSS-in-JS style injection.

4. **Nested Ornament restriction**

   - The MVP does not support declaring `<Ornament />` inside another Ornament's content tree.
   - Development builds should warn when nested declarations are detected.
   - Inner nested Ornament declarations must not create a native Ornament instance.
   - Future nested support, if needed, must be treated as a separate design change.

5. **Ornament content spatial primitive boundary**

   - Ornament content is a window-level DOM portal. It may contain normal DOM and React components, but it must not recursively create native WebSpatial spatial instances from within the Ornament portal.
   - Reuse the existing Attachment boundary pattern rather than recursively scanning React children: the Ornament portal content should be wrapped in an internal context such as `InsideOrnamentContext`, and spatial primitive implementations should check that context at their creation boundary.
   - Nested `enable-xr` / SpatialDiv content should warn in development and render as plain DOM, stripping spatial-only props and avoiding `createSpatialized2DElement`.
   - Nested `Model` should warn in development and degrade to the native `<model>` fallback, stripping spatial-only event props and avoiding `SpatializedStatic3DElementContainer`.
   - Nested `Reality` should warn in development and render `null`, avoiding Reality root creation and child subtree mounting.
   - Nested `<Ornament />` remains a separate no-op case under the nested Ornament restriction above.

6. **Defaults and normalization**

   - `attachmentAnchor = 'bottom'`
   - `contentAlignment = 'back'`
   - `visibility = 'visible'`
   - `width = 200`
   - `height = 150`
   - `cornerRadius = { topLeading: 0, bottomLeading: 0, topTrailing: 0, bottomTrailing: 0 }`
   - `backgroundMaterial = 'none'`
   - Invalid `attachmentAnchor` values, and specifically `topFront`, `top`, and `topBack`, fall back to `bottom`.
   - Invalid `contentAlignment` falls back to `back`; valid top values remain allowed for `contentAlignment`.
   - Invalid `visibility` falls back to `visible`.
   - Invalid non-positive numeric size values fall back to defaults.
   - Invalid corner radius values fall back to `0` per corner.
   - Invalid background material values fall back to `none`.
   - Normalization should be centralized in core/shared logic to avoid platform drift.

7. **Core runtime model**

   - Core introduces `Ornament extends SpatialObject`.
   - `SpatialSession.createOrnament(options)` creates an Ornament instance in the shared `SpatialObject` registry and returns `id + windowProxy`.
   - `SpatialScene.addOrnament(id)` activates the registered item in the active host list.
   - `Ornament.update(options)` updates the registered item whether or not it is currently active in the host list.
   - `Ornament.destroy()` removes the runtime object and releases container resources.
   - Ornament does not reuse the `Attachment` object model or `Reality` mounting semantics.

8. **Request correlation and page isolation**

   - `createOrnament` must include a unique request id (`rid`) generated by the existing spatial request metadata utility.
   - `createOrnament` must include `wsepoch` when the current page epoch exists.
   - Runtime/native response handling must use the same freshness contract as existing spatial child-window creation paths so stale create responses from previous pages do not attach to the current page.
   - React still needs a component-local disposed guard because page-level isolation does not replace component-level unmount protection.

9. **AVP host model**

   - Access direction is `OrnamentHost -> SpatialScene -> OrnamentManager -> OrnamentElement`.
   - `OrnamentManager` manages `activeOrnaments` and ordering on top of the shared `SpatialObject` registry; mount state is represented by membership in `activeOrnaments` rather than a field on `OrnamentElement`.
   - `SpatialScene` exposes active ornaments and forwards model changes to the host layer.
   - `attachmentAnchor` maps to `.scene(UnitPoint3D)`.
   - `contentAlignment` maps to `Alignment3D`.
   - `cornerRadius` and `backgroundMaterial` are applied to the Ornament content container using the same host material/corner primitives as scene and SpatialDiv rendering where available.
   - `.parent(UnitPoint3D)` is explicitly out of scope.
   - `SpatialNavView` and Web ornaments coexist in the same window-scene host layer.
   - When ornaments overlap, AVP native ordering is the cross-platform target: earlier-created instances remain above later-created ones.

10. **Unsupported runtime behavior**

- Capability detection is centralized in `WebSpatialRuntime.supports('Ornament')`.
- React does not provide a browser-style fallback path.
- Unsupported environments return `null` from `<Ornament />` and do not render `children`.

11. **Automated validation**

- `packages/autoTest` remains the regression entrypoint.
- Tests validate runtime contracts instead of full native visual fidelity.
- Coverage must include component mount/update/unmount, CSS propagation, unsupported-runtime null rendering, create request freshness, defaults, invalid-input recovery, hidden-state handling, nested declaration warning/no-op, Ornament-content spatial primitive degradation, and basic multi-instance coexistence.

12. **Test-server demo**

- Add an `apps/test-server` page that renders `<Ornament />` instances from a dynamic list.
- The demo should expose top-level Add and Remove buttons; adding creates a new list item and a new Ornament, and removing deletes the last list item and destroys the matching Ornament.
- Each list item should expose controls for `attachmentAnchor`, `contentAlignment`, `visibility`, `width`, `height`, `cornerRadius`, and `backgroundMaterial`.
- The demo should include content-mode switches for:
  - normal DOM content with visible page-level CSS and CSS variable usage;
  - `enable-xr` / SpatialDiv marker content that should degrade to plain DOM inside Ornament;
  - `Model` content that should degrade to the native `<model>` fallback inside Ornament;
  - `Reality` content that should render `null` inside Ornament.
- The demo should expose stable selectors for the list, Add/Remove buttons, per-item controls, and selected content mode so manual testing, `packages/autoTest`, and device smoke flows can verify lifecycle and prop updates without a separate diagnostics panel.
- The demo should not use private implementation helpers or hook-style Ornament APIs; it should exercise the public `<Ornament />` API only.

## Risks / Trade-offs

- **Risk**: Component API differs from previous hook-oriented artifacts.
  - **Mitigation**: update proposal, spec, tasks, and API docs before implementation starts.
- **Risk**: Portal content can lose page styling if CSS/head propagation is incomplete.
  - **Mitigation**: reuse SpatialDiv style synchronization and add explicit CSS inheritance tests.
- **Risk**: Spatial primitives inside Ornament content could accidentally create unsupported nested native spatial instances.
  - **Mitigation**: mirror Attachment's context-based boundary, add explicit tests for `enable-xr`, `Model`, and `Reality` inside Ornament content.
- **Risk**: Runtime lifecycle now distinguishes between registered Ornament objects and host-active Ornament objects.
  - **Mitigation**: reflect host activation and destroy boundaries explicitly in commands, tasks, and tests.
- **Risk**: Asynchronous `createOrnament` responses can race page navigation or component unmount.
  - **Mitigation**: combine `rid + wsepoch` page isolation with React component-local disposed guards.
- **Risk**: Automated tests cannot fully prove AVP visual fidelity.
  - **Mitigation**: keep tests focused on runtime contracts and lifecycle observability.
- **Risk**: Manual compatibility checks become hard to repeat without a stable demo surface.
  - **Mitigation**: ship a test-server page with stable controls/selectors that mirrors automated coverage.

## Implementation Outline

1. Add core Ornament types, normalization, and runtime lifecycle.
2. Add create/add/update/destroy protocol wiring and capability detection.
3. Reuse spatial request metadata in `createOrnament` protocol URLs.
4. Add React `<Ornament />` component with mount/update/unmount lifecycle mapping.
5. Reuse SpatialDiv portal CSS/head synchronization for Ornament content.
6. Add Ornament portal boundary context and spatial primitive degradation aligned with Attachment.
7. Add nested Ornament detection and MVP no-op behavior.
8. Add AVP `OrnamentHost / OrnamentManager / OrnamentElement` integration.
9. Add an `apps/test-server` Ornament demo page with prop controls and content degradation modes.
10. Add contract-focused `packages/autoTest` coverage.
