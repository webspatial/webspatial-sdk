# Proposal: VisionOS SpatialScene refresh guard

## Why

VisionOS native `SpatialScene` can receive SpatialDiv and attachment creation requests after a page refresh cleanup boundary. Without a page-generation check, stale requests may attach content that does not belong to the current page.

VisionOS should use `wsepoch` as the freshness discriminator, while keeping `rid` only for correlation and diagnostics.

## What Changes

- Maintain `currentPageGeneration` inside VisionOS `SpatialScene`.
- Increment page generation before refresh cleanup.
- Parse `rid` and optional `wsepoch` from SpatialDiv and attachment requests.
- Reject stale requests when `wsepoch` is present and mismatches the current page generation.
- Keep compatibility mode for requests that do not carry `wsepoch`.
- Enhance inspect and logs with generation and object identity diagnostics.

## Boundaries

- This change covers VisionOS native scene lifecycle and request freshness checks.
- `rid` is used for request correlation and diagnostics only.
- `wsepoch` is the only freshness discriminator.

## Capabilities

### New Capabilities

- `visionos-spatial-scene-refresh-guard`: specifies page-generation tracking and stale-request rejection for VisionOS SpatialDiv handling.

### Modified Capabilities

- None.

## Impact

- `packages/visionOS/web-spatial/model/SpatialScene.swift`
- related VisionOS inspect / logging paths
