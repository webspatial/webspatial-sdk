## Why

visionOS main-page host windows currently start with a zero corner radius in the SDK model, which does not match the native runtime behavior the product expects. The runtime needs an explicit default host-corner rule so the initial main-page presentation is consistent before any frontend-provided corner radius arrives.

## What Changes

- Add a visionOS main-page host-corner default rule for `SpatialScene`.
- Derive the initial main-page effective corner radius from the scene background material:
  - non-transparent material => `44`
  - transparent material => `0`
- Preserve explicit `cornerRadius` updates as a higher-priority override than the default material-derived value.
- Keep `Spatialized2DElement` / SpatialDiv corner-radius behavior unchanged.

## Capabilities

### New Capabilities
- `visionos-main-page-corner`: Define the default effective corner-radius behavior for visionOS main-page host windows before explicit page-corner updates arrive.

### Modified Capabilities

## Impact

- `packages/visionOS/web-spatial/model/SpatialScene.swift`
- `packages/visionOS/web-spatial/view/SpatialSceneContentView.swift`
- `packages/visionOS/web-spatial/view/view-modifier/MaterialWithBorderCornerModifier.swift`
- `openspec/changes/visionos-main-page-corner-defaults/`
