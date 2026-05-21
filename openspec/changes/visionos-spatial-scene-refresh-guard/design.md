# Design: VisionOS SpatialScene refresh generation guard

## Context

VisionOS native `SpatialScene` registers web view state listeners and destroys spatial objects on `.didStartLoad`. It also handles `webspatial` open-window requests and creates `Spatialized2DElement` instances for SpatialDiv content.

Unlike Android shell/runtime separation, VisionOS handles `WKWebView` creation synchronously in `WKUIDelegate` open-window flow. Even so, the native layer should consume the same frontend request metadata contract so stale request semantics are explicit and testable.

## Goals / Non-Goals

**Goals:**

- Track current page generation in VisionOS `SpatialScene`.
- Clean existing spatial objects at generation boundaries.
- Consume `wsepoch` from SpatialDiv/attachment protocol URLs.
- Reject or warn on explicitly stale requests according to compatibility mode.
- Expose generation and object ids in inspect output for debugging.

**Non-Goals:**

- This change does not define frontend request id generation.
- This change does not affect Android shell or runtime behavior.
- This change does not change public JavaScript APIs.

## Decisions

### Decision 1: `SpatialScene` owns the current generation

`SpatialScene` SHALL maintain a `currentPageGeneration` value. The value increments when the main page enters `.didStartLoad` and when `resetForNavigation()` performs an explicit navigation cleanup.

### Decision 2: Creation handlers consume request epoch

`onOpenWindowHandler` SHALL parse `wsepoch` from `webspatial://createSpatialized2DElement` and `webspatial://createAttachment` URLs when present.

If `wsepoch` is present and does not match `currentPageGeneration`, the handler SHALL treat the request as stale and SHALL NOT attach the resulting SpatialDiv content to the current scene.

### Decision 3: Compatibility mode for missing metadata

During migration, missing `wsepoch` SHOULD produce debug logging and continue to accept the request. This avoids breaking older frontend bundles. A later change may reject malformed metadata after all supported SDK bundles emit `wsepoch`.

### Decision 4: Inspect exposes generation and object ids

VisionOS `SpatialScene` inspect output SHALL include enough fields to distinguish scene children from global object registry contents:

- `currentPageGeneration`
- `childrenIds`
- `spatialObjectList`
- `spatialObjectCount`

### Decision 5: Attachment handling follows the same epoch boundary

Attachment creation web views use the same protocol family and should be generation-aware where request metadata exists. Attachment metadata initialization still occurs through its existing JSB path.

## Risks / Trade-offs

- **[Risk] WKWebView open-window flow is synchronous** -> generation guard may rarely drop requests initially, but it still codifies lifecycle boundaries.
- **[Risk] Missing epoch during rollout** -> use warn-and-accept compatibility mode first.
- **[Risk] Inspect output grows** -> debug fields are acceptable because current inspect already includes debug-only object lists.

## Verification

- Add unit or integration coverage where possible for URL metadata parsing.
- Add tests or manual scenarios for refresh followed by SpatialDiv creation.
- Validate inspect output before and after navigation reset.
