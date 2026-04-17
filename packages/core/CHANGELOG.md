# @webspatial/core-sdk

## 1.6.0

### Minor Changes

- f1b28eb: Model add play(), pause(), and paused for playback controls
- 0f743a1: Model add <source> element support for multi-format fallback
- 19a0daf: manifest support new xr_spatial_scene API
- 5d72631: Add autoplay attribute to <Model>

  When a 3D model contains an embedded animation, developers can opt into automatic playback via a simple boolean attribute. When autoplay is set, the model's first available animation begins playing as soon as the model has successfully loaded.

- 19a0daf: update initScene callback input pre to be previous return value.
- 005480c: Model add duration and playbackRate for animation control
- d9a0418: Add loop attribute to <Model>

  When loop is set, the animation automatically seeks back to the start upon reaching the end.

### Patch Changes

- afb6c35: fix spatialDiv create issue. API change for token access.
- ee7c68f: Fix Spatial UA detection and align no-runtime fallback behavior
- 3d62c5d: Pico OS: when `webSpatial.genToken()` is present, rewrite `window.open` for **`createSpatialized2DElement`** and **`createAttachment`** to the token URL form (`command=` + optional `rid`). Other `webspatial://` URLs are left unchanged.

## 1.5.0

### Minor Changes

- 3b304a1: Introduces runtime reactivity to our 3D API. Previously, entities were mostly static after instantiation. We can now dynamically update material properties, modify geometry in-place, and apply material overrides to model entities on the fly.

### Patch Changes

- c7b240c: Project Swan renamed to Pico OS

## 1.4.0

### Minor Changes

- 945856b: add enableInput for Entity
  move reality events definition from specific Entity to top-level Reality
- 56e98c8: rename innerDepth to xrInnerDepth and outerDepth to xrOuterDepth
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
- 8f8c50a: Spatial rotate axis constraint for spatialized elements.

  - **Core**
    - `SpatializedElementProperties` adds optional `rotateConstrainedToAxis` (Vec3) on partial updates to native.
  - **React**
    - `spatialEventOptions={{ constrainedToAxis: Vec3 | [number, number, number] }}` on spatialized containers and JSX intrinsics (`enable-xr`); omit or `[0,0,0]` means unconstrained.
    - `PortalSpatializedContainer` syncs axis via `updateProperties`; `Model` / degraded paths strip `spatialEventOptions` from DOM.
  - **visionOS**
    - `RotateGesture3D(constrainedToAxis:)` when axis is non-zero; world-space axis, normalized on native.

### Patch Changes

- 8c50a0f: chore:update spatialEntityEventtype
- dabb15f: Update UA injection logic in VisionOS and add WSAppShell version number
- 2f2a3a8: Model ready promise triggers rejection when URL is changed midway
- 931f236: rename offsetBack to xrOffsetBack for naming consistency

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

- 1405681: Require URL for SpatializedStatic3DElement

## 1.2.1

## 1.2.0

### Patch Changes

- 539e61f: fix entity drag gesture event type
- f0ab8eb: Maintain the original creation process of Spatialized2DElement on the Android platform and optimize the creation process of Spatialized2DElement on the new platform
- 4359ba1: Reconstruct the creation process of Spatialized2dElement
- 2632112: Optimize the creation process of SpatialDiv on Android
- bdd9065: Change <Model> entityTransform type from DOMMatrix to DOMMatrixReadOnly

## 1.1.0

### Patch Changes

- 3412d6d: using correct spatialid name when running on Android

## 1.0.5

## 1.0.4

## 1.0.3

## 1.0.2

## 1.0.1

## 1.0.0

### Major Changes

- bfb72fc: first major version

### Patch Changes

- bc1fcc1: support initScene with resizeRange

## 0.1.23

### Patch Changes

- 3a42a35: Fixed the issue where the default version number of the native was “PACKAGE_VERSION” and the client got the version incorrectly

## 0.1.22

## 0.1.21

## 0.1.20

## 0.1.19

## 0.1.18

## 0.1.17

## 0.1.16

## 0.1.15

## 0.1.14

### Patch Changes

- a87c8bf: support setStyle api in https env
- 1a9e18c: getClientVersion export version from **WEBSPATIAL_CORE_SDK_VERSION**

## 0.1.13

### Patch Changes

- bc93209: export version
- 1c0709c: add close container method
- 3e0b072: Add react to ci test

## 0.1.12

### Patch Changes

- f6befd2: fix SpatialWindowComponent.setstyle error

## 0.1.11

### Patch Changes

- 6cc8bef: Get androidXR command message working again

## 0.1.10

## 0.1.9

## 0.1.8

### Patch Changes

- 5be664b: add baseURI to createWindowContext method, fixing path issues related to assets

## 0.1.7

### Patch Changes

- 123ee60: bundle files into one

## 0.1.6

## 0.1.5

## 0.1.4

## 0.1.3

## 0.1.2

## 0.1.1

## 0.1.0

### Minor Changes

- a2a401e: version bump

## 0.0.4

### Patch Changes

- 997d398: support fixed position for Model including wrapped under a spatialdiv

## 0.0.4-alpha.0

### Patch Changes

- 997d398: support fixed position for Model including wrapped under a spatialdiv

## 0.0.3

### Patch Changes

- ee36e07: add SpatialObject name to provide more infomation when debug

## 0.0.2

### Patch Changes

- d15b125: update version

## 0.0.1

### Patch Changes

- 456d15f: change ModelDragEvent to SpatialModelDragEvent in coresdk
