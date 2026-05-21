# Proposal: Refresh-safe SpatialDiv request correlation

## Why

`createSpatialized2DElement` and attachment creation use `webspatial://` window-open style protocols before a native content host is available. The current request correlation is effectively a short-lived incremental id in the frontend platform adapter. After a page reload, the JavaScript execution context may recreate the same incremental ids, while previously initiated native creation results may still complete later.

The SDK needs a frontend-owned request metadata contract that makes every SpatialDiv/attachment creation request refresh-safe and easy for host platforms to correlate. The contract must stay self-contained in the frontend SDK and platform adapters: it defines what metadata is emitted, not how any specific host implementation accepts or rejects stale native objects.

## What Changes

- Add a refresh-safe request metadata contract for `webspatial://createSpatialized2DElement` and `webspatial://createAttachment` protocol URLs.
- Introduce two protocol fields:
  - `wsrid`: opaque unique request id used for async callback correlation.
  - `wsepoch`: page lifecycle epoch value, when provided by the host runtime.
- Update PicoOS frontend platform adapter protocol URLs to include `wsrid` and `wsepoch` while retaining compatibility with existing `rid` callback behavior during migration.
- Update VisionOS frontend platform adapter protocol URLs to carry the same metadata contract for consistency.
- Add timeout cleanup for pending request receivers so unresolved protocol requests do not retain callbacks indefinitely.
- **BREAKING**: none. Existing public APIs remain unchanged.

## Capabilities

### New Capabilities

- `spatial-div-request-correlation`: specifies request metadata for SpatialDiv and attachment creation protocols, request id uniqueness, optional epoch propagation, and pending callback cleanup.

### Modified Capabilities

- None.

## Impact

- `packages/core/src/platform-adapter/pico-os/PicoOSPlatform.ts`
- `packages/core/src/platform-adapter/vision-os/VisionOSPlatform.ts`
- `packages/core/src/SpatialWebEvent.ts`
- `packages/core/src/scene-polyfill.ts`
- `packages/core/src/SpatializedElementCreator.ts`
- Relevant unit tests in `packages/core`
