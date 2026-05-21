# Proposal: VisionOS SpatialScene refresh generation guard

## Why

VisionOS native code owns a `SpatialScene` implementation with its own `WKWebView` lifecycle, `Spatialized2DElement` creation, and scene object registry. On page navigation or refresh, `SpatialScene` currently destroys registered spatial objects when the main page starts loading. However, `webspatial://` window-open requests can create new native `Spatialized2DElement` instances through `onOpenWindowHandler`.

The VisionOS native layer should explicitly model the page lifecycle generation so SpatialDiv creation requests are associated with the page generation that initiated them. This keeps VisionOS aligned with the frontend request metadata contract and prevents stale creation from being attached to the wrong scene generation.

## What Changes

- Add a page generation / epoch state to VisionOS `SpatialScene`.
- Increment the generation when the main web view starts loading and when navigation reset explicitly clears scene objects.
- Read request metadata from `webspatial://createSpatialized2DElement` and `webspatial://createAttachment` open-window URLs.
- Compare request epoch with current scene generation before accepting generation-aware creation requests.
- Add debug / inspect fields for page generation and spatial object ids.
- **BREAKING**: none. Initial malformed metadata handling should remain compatible unless a request is explicitly stale.

## Capabilities

### New Capabilities

- `visionos-spatial-scene-refresh-guard`: specifies VisionOS native page generation tracking, request metadata consumption, stale SpatialDiv handling, and inspect visibility.

### Modified Capabilities

- None.

## Impact

- `packages/visionOS/web-spatial/model/SpatialScene.swift`
- `packages/visionOS/web-spatial/model/Spatialized2DElement.swift`
- `packages/visionOS/web-spatial/webview/SpatialWebController.swift`
- `packages/visionOS/web-spatial/webview/SpatialWebViewModel.swift`
- `packages/visionOS/web-spatialTests/*`
