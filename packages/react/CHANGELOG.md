# @webspatial/react-sdk

## 1.8.0

### Minor Changes

- fdc1e85: The Core SDK lets you query WebSpatial runtime capabilities and shell versions at runtime (`supports`, `getRuntime`) and resolve JSB-style embedded shells via `resolveJsbAdapterPlatform`. The built-in Android platform adapter is removed from core—integrate Android through your host shell instead.

  The React SDK adds runtime gating (`noRuntime`, `webSpatialRuntime`) and updates spatialized components and related hooks so behavior matches runtime availability.

- 9801a07: Add lazy loading support to Model
- 685b545: **ResourceRegistry:** add `subscribe(id, listener)` and `notify(id)`. Subscribers run when a resource promise settles after `add()` (success or failure), and on `remove`, `removeAndDestroy`, and `destroy()`.

  **React `<Texture>`:** call `notify(id)` after in-place `updateProperties({ url })` so materials refresh when the URL changes without a new `add()` for the same logical texture id.

  **React `<UnlitMaterial>`:** subscribe to the bound `textureId` and bump an internal revision so the update path re-runs when the texture settles or is replaced; remove `surfaceSyncRev`. Material init still creates a tint-only material when the texture promise rejects so entities keep a valid material id until a later successful load.

  **visionOS `Dynamic3DManager`:** coalesce remote downloads per URL string and write cache files under `Documents` using a SHA256-prefix plus basename so concurrent loads no longer `removeItem` the same path another reader is using.

- 550b3fe: Add currentTime property to Model to read and seek animation time
- 23b353e: Export `CapabilityKey` from core runtime and re-export it from the React SDK so app code can type capability checks via `@webspatial/react-sdk` without importing `@webspatial/core-sdk` directly.
- 9be9a9f: add poster attribute to <Model>
- 68c3fdd: Add loadable texture resources for Dynamic 3D: core `SpatialTextureResource`, `CreateTexture` / `UpdateTextureProperties`, and `textureId` on unlit materials; React `<Texture>` plus `UnlitMaterial` wiring that resolves logical ids to platform ids; VisionOS async `TextureResource` loading and scene handlers. Test-server includes a textured unlit box demo; Dynamic 3D PRD documents textures and trims out-of-scope sections.

### Patch Changes

- 907fab6: Fix React 19 type compatibility for local builds by initializing internal `useRef` values explicitly while preserving React 18 support.
- 8e5209e: Remove unused local variables and imports flagged by CodeQL quality checks.
- fa404a9: Avoid exporting `global.d.ts` as a runtime module from `@webspatial/core-sdk`, so stricter bundlers and local `file:`/workspace consumers can resolve the built package correctly.
- ad568f8: Add a changeset for the Reality `enable-xr` follow-up: keep JSX runtime special-casing while not exposing `enable-xr` in the public `RealityProps` API.
- e95d4bd: Fix Model ready promise not working
- 0932bf3: Split **picoOS** capability rows from visionOS in `CAPABILITY_TABLE`: `supports('xrInnerDepth')` and `supports('xrOuterDepth')` are **false** for PicoWebApp **0.1.1** and **0.1.2**; visionOS shell rows are unchanged.
- b855e15: fix: Model reloads when switching from eager to lazy
- 763c65d: Add React 18 and React 19 compatibility fixtures that type-check and build the WebSpatial JSX runtime against host app React types.
- 8cf1338: Bump direct esbuild devDependency to ^0.25.0 and extend pnpm.overrides
  to pin patched versions for transitive packages flagged by Dependabot
  (@xmldom/xmldom, basic-ftp, vite, lodash/lodash-es, path-to-regexp,
  flatted, immutable, serialize-javascript, minimatch, rollup,
  @modelcontextprotocol/sdk, @remix-run/router, react-router, validator,
  glob, postcss, axios, follow-redirects, brace-expansion, picomatch,
  ajv, markdown-it, mdast-util-to-hast, body-parser, js-yaml, qs, diff,
  tmp, @eslint/plugin-kit, min-document, form-data). No code changes;
  verified via pnpm test and visionOS Simulator build.

  Follow up by upgrading the remaining direct dependency entry points that
  were still resolving stale vulnerable lockfile paths: move
  `react-router-dom` to ^6.30.2 in demo apps, upgrade the React SDK test
  toolchain to vitest 3.1.2 / @vitejs/plugin-react 4.4.1, align the
  builder package to rollup ^4.60.2, and add exact pnpm overrides for
  stubborn `yaml`, `rollup`, `minimatch`, and `path-to-regexp` nodes so
  the workspace lockfile resolves to patched versions consistently.

- 8e5d5cf: `ref.current` on spatial containers (`SpatialDiv`, `Model`, `Spatialized2DElementContainer`, `Reality` entities) is now the real underlying `HTMLElement` instead of a `Proxy` wrapper. As a result:

  - `ref.current instanceof HTMLElement` (and `instanceof Node`) is `true`.
  - Native APIs that brand-check `Element` now accept `ref.current` directly — `ResizeObserver.observe(ref.current)` (#1067), `IntersectionObserver.observe(ref.current)`, `MutationObserver.observe(ref.current, …)`, `parent.contains(ref.current)`, `document.querySelector(...) === ref.current`, and `getComputedStyle(ref.current)` all work without any polyfill.
  - `ref.current.removeAttribute('id' /* or any name other than 'style' / 'class' */)` now correctly removes the attribute — previously it was silently dropped.
  - `ref.current.style.setProperty('transform', value, 'important')` now preserves the `priority` argument when forwarding to the spatial transform layer.

  Spatial behavior (auto `xr-spatial-default` className, `style.transform` / `style.visibility` proxying, `xrClientDepth` / `xrOffsetBack` accessors, `extraRefProps`) is unchanged.

  Internally, the standard host's hidden-placeholder appearance (`visibility: hidden`, `transition: none`, `transform: none | translateZ(0)`) is no longer written as inline style — it is now applied via CSS rules keyed on the new `data-xr-host` and `data-xr-transform-active` attributes. This is required so that React commits do not write through the spatial style proxy and clobber the user's `style.transform` value on the probe. Visual behavior is unchanged.

  The hidden-host stylesheet is now injected into each host's containing tree root on mount (including `ShadowRoot`s used by web components / micro-frontends / shadow-isolated design systems). Without this, the document-level stylesheet would not cross shadow boundaries and the bare 2D placeholder would show through — a side-effect of moving the hidden-placeholder rules out of inline style. The injection is idempotent per root via a `data-xr-spatial-default-style` marker on the `<style>` element. As an incidental fix, the `--xr-back` / `--xr-depth` / `--xr-z-index` / `--xr-background-material` defaults now also reach spatial containers mounted inside shadow roots.

  Known limitation: the per-mount injection is currently keyed on `root === document` and so does not cover spatial hosts mounted inside same-origin iframes / other foreign `Document` instances — those will see the bare 2D placeholder until [#1197](https://github.com/webspatial/webspatial-sdk/issues/1197) ships. As a workaround, call `injectSpatialDefaultStyle()` once from inside the iframe's own realm.

  The architectural invariants behind the standard-host / probe split, the spatial style proxy, and the `xr-spatial-default` / `data-xr-host` contracts are documented in `packages/react/src/spatialized-container/ARCHITECTURE.md` for future maintainers.

  Note: the previously undocumented `ref.current.__raw` field is removed; use `ref.current` directly.

- 3ae32d4: Sync CSS-in-JS style text updates into spatial child windows so dynamic class changes keep their matching styles in SpatialDiv and Attachment content.

  Also scan the entire MutationObserver batch when deciding sync timing: if any record indicates an inline `<style>` change, the whole batch is scheduled as `immediate`, so a `<link rel=stylesheet>` record earlier in the same batch no longer downgrades co-occurring `<style>` text updates to the delayed path.

- 0210b68: Add a SpatialDiv-only `onSpatialContentReady` lifecycle with layout-effect timing and cleanup, ensure ref dispatch is deduplicated and available before ready callbacks, and include a Three.js test-server page for nested ready/cleanup verification.

## 1.6.1

## 1.6.0

### Minor Changes

- f1b28eb: Model add play(), pause(), and paused for playback controls
- 0f743a1: Model add <source> element support for multi-format fallback
- 5d72631: Add autoplay attribute to <Model>

  When a 3D model contains an embedded animation, developers can opt into automatic playback via a simple boolean attribute. When autoplay is set, the model's first available animation begins playing as soon as the model has successfully loaded.

- 005480c: Model add duration and playbackRate for animation control
- d9a0418: Add loop attribute to <Model>

  When loop is set, the animation automatically seeks back to the start upon reaching the end.

### Patch Changes

- c44661f: Keep the transform/visibility probe in sync with the Standard spatial host when class updates do not flow through React props (e.g. styled-components). Mirrors Standard `className` onto the probe via MutationObserver and `SpatializedContainer` state, coalesces sync with microtasks, and skips redundant DOM/state updates.
- ee7c68f: Fix Spatial UA detection and align no-runtime fallback behavior
- 5df9519: fix: incorrect display style for spatial containers

## 1.5.0

### Minor Changes

- 3b304a1: Introduces runtime reactivity to our 3D API. Previously, entities were mostly static after instantiation. We can now dynamically update material properties, modify geometry in-place, and apply material overrides to model entities on the fly.

### Patch Changes

- Updated dependencies [3b304a1]
- Updated dependencies [c7b240c]
  - @webspatial/core-sdk@1.5.0

## 1.4.0

### Minor Changes

- 945856b: add enableInput for Entity
  move reality events definition from specific Entity to top-level Reality
- 0def1ef: Remove deprecated spatial measurement APIs: getBoundingClientRect, getBoundingClientCube, toSceneSpatial, toLocalSpace and their internal message types (CubeInfoMsg, TransformMsg)
- 58e1f69: Attachment init flow and lifecycle cleanup.

  - **Core**
    - Split attachment creation into `CreateAttachmentEntityCommand` (window/engine) and `InitializeAttachmentCommand` (send id, parent, position, size over JSB so native initializes after window exists).
    - `createAttachmentEntity()` now runs both; native receives full options via init command.
  - **React**
    - `AttachmentEntity`: inline head-style sync via `MutationObserver` on `document.head`; direct cleanup on unmount (no StrictMode-only logic).
    - `useEntity`: forwards all entity event handlers (tap, drag, rotate, magnify) to `useEntityEvent`.
    - `useSpatializedElement`: ref-based cleanup so elements are destroyed correctly on unmount.
    - Removed React 18 StrictMode–specific deferred cleanup from Reality, useEntity, AttachmentEntity, useSpatializedElement.
  - **visionOS**
    - Attachment manager and JSB handling updated for init command and consolidated window creation.

- 087fa12: react-sdk:support convertCoordinate
- 98fd429: react-sdk support pointToPhysical,physicalToPoint API from useMetrics() hook
- 0019cdf: export World as alternative API to SceneGraph
- 63e44d8: react-sdk export new API for 3D Entity and Material
- ee8a650: add createElement for old jsx transform
- 8f8c50a: Spatial rotate axis constraint for spatialized elements.

  - **Core**
    - `SpatializedElementProperties` adds optional `rotateConstrainedToAxis` (Vec3) on partial updates to native.
  - **React**
    - `spatialEventOptions={{ constrainedToAxis: Vec3 | [number, number, number] }}` on spatialized containers and JSX intrinsics (`enable-xr`); omit or `[0,0,0]` means unconstrained.
    - `PortalSpatializedContainer` syncs axis via `updateProperties`; `Model` / degraded paths strip `spatialEventOptions` from DOM.
  - **visionOS**
    - `RotateGesture3D(constrainedToAxis:)` when axis is non-zero; world-space axis, normalized on native.

- 931fb2d: rename clientDepth to xrClientDepth

### Patch Changes

- 931f236: rename offsetBack to xrOffsetBack for naming consistency
- Updated dependencies [58e1f69]
- Updated dependencies [8c50a0f]
- Updated dependencies [087fa12]
- Updated dependencies [dabb15f]
- Updated dependencies [945856b]
- Updated dependencies [56e98c8]
- Updated dependencies [98fd429]
- Updated dependencies [2f2a3a8]
- Updated dependencies [0def1ef]
- Updated dependencies [8f8c50a]
- Updated dependencies [931f236]
  - @webspatial/core-sdk@1.4.0

## 1.3.0

### Minor Changes

- 93fe590: Add attachments support across React, Core SDK, and visionOS runtime, plus navigation guard and demo.

  - React API
    - New <AttachmentAsset name="..."> to declare attachment UI outside <SceneGraph>.
    - New <AttachmentEntity attachment="..." position size /> to place the declared UI in 3D under a parent entity.
    - Attachment content is rendered via createPortal so it shares React state with the main app.
  - Core SDK
    - Attachment types and SpatialSession.createAttachmentEntity(...).
    - Create/update/destroy commands: webspatial://createAttachment, UpdateAttachmentEntity, DestroyCommand.
    - Attachment wrapper with getContainer(), update(), destroy().
  - visionOS (AVP runtime)
    - Native AttachmentManager with a child WKWebView per attachment.
    - SpatialScene intercepts webspatial://createAttachment, handles update/destroy, and cleans up on reload/destroy.
    - SpatializedDynamic3DView renders attachments via RealityView(..., attachments:) and parents them under the correct SpatialEntity.
  - Navigation fix
    - Prevent internal webspatial:// URLs from being forwarded to UIApplication.shared.open(...).
  - Test page
    - /reality/attachments demo page: hide/show, animation (attachments follow parent), shared React state.
  - Notes
    - Attachments are 2D UI surfaces only (no nested <Reality> / 3D APIs inside attachments).
    - No billboard/camera-facing policy in this PR.

- 4f86f47: Expose per-event convenience fields on Spatial Events to mirror `detail`:

  - `SpatialDragEvent.translationX/Y/Z` (from `detail.translation3D`)
  - `SpatialRotateEvent.quaternion` (from `detail.quaternion`)
  - `SpatialMagnifyEvent.magnification` (from `detail.magnification`)

### Patch Changes

- 118b8e6: Fix a crash when accessing `ready`/`entityTransform` on static 3D models before the underlying spatialized element is attached.
- ef447d2: Fixed Model ref.current to be stable after initial render

  Changes to ref cannot be observed since React doesn't re-render
  on ref changes. So ref.current.ready Promise needs to be stable and
  immediately available. It should resolve after the 3D model has rendered

- f207e1a: Fix head style synchronization for spatial windows (SpatialDiv/attachments) to avoid duplicated or stale stylesheet injection during rapid host `<head>` updates.
- Updated dependencies [93fe590]
- Updated dependencies [1405681]
  - @webspatial/core-sdk@1.4.0

## 1.2.1

### Patch Changes

- fd29643: Fix a crash when accessing `ready`/`entityTransform` on static 3D models before the underlying spatialized element is attached.
  - @webspatial/core-sdk@1.2.1

## 1.2.0

### Minor Changes

- 8225a53: add offsetX for spatialDragStartGesture and spatialTapGesture
- bdd9065: Change <Model> entityTransform type from DOMMatrix to DOMMatrixReadOnly

### Patch Changes

- 539e61f: fix entity drag gesture event type
- 418d196: avoid xr-spatial-default overrid user's css setting
- 5eed637: Fix relative Model src resolution when enable-xr by using URL with document.baseURI, ensuring correct absolute URLs with app base paths.
- 2b80e53: remove Reality spatial gesture type
- 7ffb18c: fix spatialdiv spatial gesture bug
- Updated dependencies [539e61f]
- Updated dependencies [f0ab8eb]
- Updated dependencies [4359ba1]
- Updated dependencies [2632112]
- Updated dependencies [bdd9065]
  - @webspatial/core-sdk@1.2.0

## 1.1.0

### Patch Changes

- d1242ea: fixbug when spatialdiv.style.setProperty visibility/transform
- ffcfcc8: fix window.open URL cast issue
- Updated dependencies [3412d6d]
  - @webspatial/core-sdk@1.1.0

## 1.0.5

### Patch Changes

- @webspatial/core-sdk@1.0.5

## 1.0.4

### Patch Changes

- 67a908c: move CSSSpatialDiv to isolated div, which help make SpatialDiv structure clean
  - @webspatial/core-sdk@1.0.4

## 1.0.3

### Patch Changes

- d83cd93: fix: translateX(10%) not work in transform style
  - @webspatial/core-sdk@1.0.3

## 1.0.2

### Patch Changes

- a45aabd: fix spatialDiv a link should change the main window url and support nested

  - @webspatial/core-sdk@1.0.2

- 94e2e0d0: fix: scene hook param

## 1.0.1

### Patch Changes

- @webspatial/core-sdk@1.0.1

## 1.0.0

### Patch Changes

- 4dc56c3: fix bug: when refresh page in safari tool, the page may be invisible occasionally
- Updated dependencies [bfb72fc]
- Updated dependencies [bc1fcc1]
  - @webspatial/core-sdk@1.0.0

## 0.1.23

### Patch Changes

- Updated dependencies [3a42a35]
  - @webspatial/core-sdk@0.1.23

## 0.1.22

### Patch Changes

- @webspatial/core-sdk@0.1.22

## 0.1.21

### Patch Changes

- @webspatial/core-sdk@0.1.21

## 0.1.20

### Patch Changes

- @webspatial/core-sdk@0.1.20

## 0.1.19

### Patch Changes

- ec06fc2: set spatialdiv portalinstance body background transparent
  - @webspatial/core-sdk@0.1.19

## 0.1.18

### Patch Changes

- 126c45a: check html spatial style when html className changed
  - @webspatial/core-sdk@0.1.18

## 0.1.17

### Patch Changes

- 2a6ba54: set spatialdiv's css transform to 'translateZ(0)' if transform value …
- dbea2f0: add type declare for style.enableXr
- 3db2b7b: export type WindowContainerOptions
  - @webspatial/core-sdk@0.1.17

## 0.1.16

### Patch Changes

- @webspatial/core-sdk@0.1.16

## 0.1.15

### Patch Changes

- 5b72246: export dts for window.xrCurrentSceneDefaults
  - @webspatial/core-sdk@0.1.15

## 0.1.14

### Patch Changes

- Updated dependencies [a87c8bf]
- Updated dependencies [1a9e18c]
  - @webspatial/core-sdk@0.1.14

## 0.1.13

### Patch Changes

- 208e5b4: sync css style display property to portal div
- 0cfd93d: export version from react-sdk
- cc59fbf: export model type
- e10a722: add **webspatialsdk** banner for jsx-runtime
- Updated dependencies [bc93209]
- Updated dependencies [1c0709c]
- Updated dependencies [3e0b072]
  - @webspatial/core-sdk@0.1.13

## 0.1.12

### Patch Changes

- 16e9be0: fix scene polyfill module reset
- Updated dependencies [f6befd2]
  - @webspatial/core-sdk@0.1.12

## 0.1.11

### Patch Changes

- cd50d6b: separate avp and web version by ext filename instead of **WEB**
- 56f32c3: fix a link handling error
- Updated dependencies [6cc8bef]
  - @webspatial/core-sdk@0.1.11

## 0.1.10

### Patch Changes

- 2ea77fd: fix: restore empty module replacement when building web version
- f93d6cc: when global style changes, html material should change according to the new material value
- 900e704: add xr css type declare
  - @webspatial/core-sdk@0.1.10

## 0.1.9

### Patch Changes

- @webspatial/core-sdk@0.1.9

## 0.1.8

### Patch Changes

- 7c8c556: support css hot reload
- Updated dependencies [5be664b]
  - @webspatial/core-sdk@0.1.8

## 0.1.7

### Patch Changes

- cb92fab: fix portalinstance layout issue
- d2ff8ef: fix sub portal instance layout bug
- Updated dependencies [123ee60]
  - @webspatial/core-sdk@0.1.7

## 0.1.6

### Patch Changes

- df94278: bugfix: use useState instead of useRef
  - @webspatial/core-sdk@0.1.6

## 0.1.5

### Patch Changes

- 3b65e89: fix placeholder not displaying when using the model-viewer fallback
  - @webspatial/core-sdk@0.1.5

## 0.1.4

### Patch Changes

- 77c2df3: support --xr-z-index
- 243d190: 1. portalinstance body's size should be the size of children
  - @webspatial/core-sdk@0.1.4

## 0.1.3

### Patch Changes

- deb60e1: update dts for '--xr-background-material' and '--xr-back'
  - @webspatial/core-sdk@0.1.3

## 0.1.2

### Patch Changes

- 99ebe7e: provide warning and failed load event if model-viewer script is missing
  - @webspatial/core-sdk@0.1.2

## 0.1.1

### Patch Changes

- c2d4a30: add JSX namespace
  - @webspatial/core-sdk@0.1.1

## 0.1.0

### Minor Changes

- fe1e2ab: add react-server export for jsx-runtime
- a2a401e: version bump

### Patch Changes

- Updated dependencies [a2a401e]
  - @webspatial/core-sdk@0.1.0

## 0.0.18

### Patch Changes

- f102c02: set model's scrollWithParent property

## 0.0.17

### Patch Changes

- bf0ad9a: keep css in portalInstance the same order as in entry page
- bba3767: SpatialDiv's default material should be none material

## 0.0.16

### Patch Changes

- b1e16b5: only root spatialdiv need to consume window.scrollY
- 997d398: support fixed position for Model including wrapped under a spatialdiv
- 4d95b2b: when model3d is in nested spatialdiv, there's no need to consume window.scrollY
- Updated dependencies [997d398]
  - @webspatial/core-sdk@0.0.4

## 0.0.16-alpha.1

### Patch Changes

- 997d398: support fixed position for Model including wrapped under a spatialdiv
- Updated dependencies [997d398]
  - @webspatial/core-sdk@0.0.4-alpha.0

## 0.0.16-alpha.0

### Patch Changes

- b1e16b5: only root spatialdiv need to consume window.scrollY
- 4d95b2b: when model3d is in nested spatialdiv, there's no need to consume window.scrollY

## 0.0.15

### Patch Changes

- 6d619c9: set portalinstance body have inline-block display, so that body's width/height is determined by spatialdiv

## 0.0.14

### Patch Changes

- Updated dependencies [ee36e07]
  - @webspatial/core-sdk@0.0.3

## 0.0.13

### Patch Changes

- cb34f1d: support css position fixed property in nested spatialdiv
- aa894ba: Support position fix in nested spatialdiv

## 0.0.12

### Patch Changes

- Updated dependencies [d15b125]
  - @webspatial/core-sdk@0.0.2

## 0.0.11

### Patch Changes

- 456d15f: change ModelDragEvent to SpatialModelDragEvent in coresdk
- 9fe84e4: support 'enable-xr-monitor' property which is used to monitor childre…
- c597a16: simplify react-sdk export entries. Remove cjs output.
- Updated dependencies [456d15f]
  - @webspatial/core-sdk@0.0.1

## 0.0.10

### Patch Changes

- f0da37e: more strict model source validation
- 4d727ab: set @webspatial/core-sdk as peerdep

## 0.0.9

### Patch Changes

- 2bb9cfc: when load failure occurs, we should fire an onLoad event with ready: …

## 0.0.8

### Patch Changes

- 193427e: monitor exteral stylesheet change in html header
- c1e7126: sync html className to PortalInstance

## 0.0.7

### Patch Changes

- 7c01263: hide placeholder in sub portalinstance
- 2641c6c: jsx runtime should external react-sdk
- 155300b: Fix scene api support in portalInstance
- 2e2bc94: fix model position calculation error
- 2b4e19b: fix: Resizing webpage seems to cause issues with <Model> #369

## 0.0.6

### Patch Changes

- d47def5: fix define data type error

## 0.0.5

### Patch Changes

- 0eded09: react-sdk ship both esm/cjs,vite plugin use resolve instead of cjs entry

## 0.0.4

### Patch Changes

- 511d42b: support css fixed position for SpatialDiv
- e3aabbd: check DOMContentLoaded in more robust way
- Updated dependencies [511d42b]
- Updated dependencies [e3aabbd]
  - @webspatial/react-sdk@0.0.4

## 0.0.3

### Patch Changes

- 0b74270: let process.env.xrEnv default to not avp
- Updated dependencies [0b74270]
  - @webspatial/react-sdk@0.0.3

## 0.0.2

### Patch Changes

- 7493c5a: add ts for vite plugin
- 8bbb490: update peerDeps version to >=18
- Updated dependencies [7493c5a]
- Updated dependencies [8bbb490]
  - @webspatial/react-sdk@0.0.2

## 0.0.1

### Patch Changes

- 1a6fb29: update description
- Updated dependencies [1a6fb29]
  - @webspatial/react-sdk@0.0.1
