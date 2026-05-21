# Tasks: visionos-spatial-scene-refresh-guard

## 1. Page generation state

- 1.1 Add `currentPageGeneration` to VisionOS `SpatialScene`.
- 1.2 Increment generation before destroying spatial objects on `.didStartLoad`.
- 1.3 Ensure `resetForNavigation()` uses the same generation boundary behavior.

## 2. Request metadata parsing

- 2.1 Add helper to parse `wsrid` and `wsepoch` from `webspatial` URLs.
- 2.2 Apply parsing in `onOpenWindowHandler` for SpatialDiv creation.
- 2.3 Apply parsing in attachment creation where metadata is present.

## 3. Stale request handling

- 3.1 If `wsepoch` is present and mismatches current generation, do not attach SpatialDiv content to the current scene.
- 3.2 Add debug logging for accepted, stale, and malformed metadata paths.
- 3.3 Keep missing metadata in warn-and-accept compatibility mode.

## 4. Inspect and diagnostics

- 4.1 Add `currentPageGeneration` to inspect output.
- 4.2 Add or refine children/object id fields for refresh debugging.
- 4.3 Ensure inspect distinguishes children from global object registry contents.

## 5. Verification

- 5.1 Add tests for metadata parsing helpers.
- 5.2 Add tests or manual validation for refresh cleanup followed by SpatialDiv creation.
- 5.3 Run VisionOS package tests where available.
