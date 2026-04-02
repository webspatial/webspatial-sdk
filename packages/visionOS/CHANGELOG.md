# @webspatial/platform-avp

## 2.0.0

### Patch Changes

- 4b46782: refactor: optimize search for d3dElement

## 1.4.0

### Minor Changes

- 56e98c8: rename innerDepth to xrInnerDepth and outerDepth to xrOuterDepth
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
- 8676fc5: convertCoordinate support 2dFrame as input and output
- 8f8c50a: Spatial rotate axis constraint for spatialized elements.

  - **Core**
    - `SpatializedElementProperties` adds optional `rotateConstrainedToAxis` (Vec3) on partial updates to native.
  - **React**
    - `spatialEventOptions={{ constrainedToAxis: Vec3 | [number, number, number] }}` on spatialized containers and JSX intrinsics (`enable-xr`); omit or `[0,0,0]` means unconstrained.
    - `PortalSpatializedContainer` syncs axis via `updateProperties`; `Model` / degraded paths strip `spatialEventOptions` from DOM.
  - **visionOS**
    - `RotateGesture3D(constrainedToAxis:)` when axis is non-zero; world-space axis, normalized on native.

### Patch Changes

- dabb15f: Update UA injection logic in VisionOS and add WSAppShell version number
- 696506e: Fix visionOS spatial element transform and gesture coordinates: use proxy transform only for local→scene (drop getBoundingClientCube); clarify location3D (element local) vs globalLocation3D (scene); define semantic local z with front face = 0 via localFrameOffsetZ (zIndex + backOffset, exclude translateZ). Rename GestureFlags to GestureState.

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

### Patch Changes

- f1177c2: Fix stale spatial panels persisting across SPA navigations by cleaning up the current scene before back/forward/reload/URL navigation.

## 1.2.1

## 1.2.0

## 1.1.0

### Minor Changes

- 5055826: Fix depth property not working on Model tag

## 1.0.5

### Patch Changes

- d8cc711: support load nosdk html

## 1.0.4

## 1.0.3

## 1.0.2

## 1.0.1

## 1.0.0

### Patch Changes

- 251e31f: add observe to listen WebView url changes
- fa91d08: support fixed scene size and set resizeRange

## 0.1.23

### Patch Changes

- b9fadd1: Move NavView to PlainWindowContainerView to make the structure more reasonable
- 19754cd: update nav style
- 36ee1ba: fix spatial div frame height

## 0.1.22

## 0.1.21

## 0.1.20

### Patch Changes

- 3c4acf0: Fixed the issue where the relative path page was empty when using a local project
- 8a99e49: Inject the version number using the CLI tool instead of loading package.json in native
- c3aa903: Navigation using new style

## 0.1.19

## 0.1.18

### Patch Changes

- bf6f9b3: reduce flicker on reopen
- db957ab: Add the WebSpatial flag to the user agent of webview
- 46f7f26: fix nav url not show when open a new page

## 0.1.17

## 0.1.16

## 0.1.15

## 0.1.14

### Patch Changes

- ff647df: reset scene window.name when reopen app
- a87c8bf: support setStyle api in https env
- 1a9e18c: set nativeAPIVersion from getPackageVersion()

## 0.1.13

### Patch Changes

- 1c0709c: add close container method
- 3e0b072: Add react to ci test

## 0.1.12

### Patch Changes

- f6befd2: fix SpatialWindowComponent.setstyle error

## 0.1.11

## 0.1.10

## 0.1.9

### Patch Changes

- 51b4e56: Fix the issue of possible errors in obtaining local static resources

## 0.1.8

### Patch Changes

- 4aa5a3b: Support new display:fullscreen and fix scope logic

## 0.1.7

## 0.1.6

## 0.1.5

## 0.1.4

## 0.1.3

### Patch Changes

- ab185cf: Fix navigation URL display issue
- 9b49c90: set default value of background material

## 0.1.2

## 0.1.1

## 0.1.0

### Minor Changes

- a2a401e: version bump

## 0.0.3

### Patch Changes

- 29b0e60: remove reference when spatialObject destroyed in window container
- 997d398: support fixed position for Model including wrapped under a spatialdiv

## 0.0.3-alpha.1

### Patch Changes

- 997d398: support fixed position for Model including wrapped under a spatialdiv

## 0.0.3-alpha.0

### Patch Changes

- 29b0e60: remove reference when spatialObject destroyed in window container

## 0.0.2

### Patch Changes

- a7092b7: Remove head comments
- cb7e33e: remove head comments

## 0.0.1

### Patch Changes

- abeda99: Change some cli parameters name and change the name of @webspatial/platform-avp to @webspatial/platform-visionos

## 0.0.3

### Patch Changes

- aa894ba: Support position fix in nested spatialdiv

## 0.0.2

### Patch Changes

- 4874f4e: Update main scene and loading view.

## 0.0.1

### Patch Changes

- de72621: Used to publish WebSpatial projects to Apple Vision Pro
