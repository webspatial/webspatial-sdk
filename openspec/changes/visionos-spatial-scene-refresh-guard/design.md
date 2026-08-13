# Design: VisionOS SpatialScene refresh guard

## Context

VisionOS `SpatialScene` owns native scene objects and receives frontend-driven SpatialDiv creation requests. Page refresh cleanup is point-in-time, but request delivery can be delayed. The native scene must reject requests that belong to an older page generation.

## Goals / Non-Goals

**Goals:**

- Make VisionOS `SpatialScene` own the authoritative current page generation.
- Use `wsepoch` as the freshness discriminator for stale-request rejection.
- Keep `rid` for correlation and diagnostics.
- Preserve compatibility for requests that do not carry `wsepoch`.
- Improve inspect output for refresh diagnosis.

**Non-Goals:**

- This change does not redefine frontend request construction.
- This change does not use `rid` for freshness checks.
- This change does not require every request to carry `wsepoch` during compatibility mode.

## Decisions

### Decision 1: `SpatialScene` owns current page generation

`SpatialScene` SHALL maintain `currentPageGeneration` and advance it at the start of page reload before cleaning up scene-owned objects.

### Decision 2: Native freshness checks use `wsepoch` only

Request handlers SHALL parse `rid` and `wsepoch` when present.

If `wsepoch` is present and does not match `currentPageGeneration`, the request SHALL be treated as stale and SHALL NOT attach content to the current scene.

### Decision 3: Compatibility mode warns and accepts missing `wsepoch`

If a request arrives without `wsepoch`, VisionOS SHALL log a compatibility warning and continue to accept the request.

This keeps older frontend bundles compatible, but stale-request rejection is active only when `wsepoch` is present.

### Decision 4: Inspect output exposes generation and object identities

Inspect output SHALL include current page generation and object identity diagnostics that let reviewers compare scene children against retained objects.

### Decision 5: Logs correlate generation and request identity

Logs SHALL make it possible to answer the following from one refresh cycle:

- when page generation advanced
- which request `rid` / `wsepoch` was accepted
- which request `rid` / `wsepoch` was rejected as stale
- what scene object ids remained after cleanup

## Risks / Trade-offs

- **[Risk] Older frontend bundles do not emit `wsepoch`** -> warn and accept in compatibility mode.
- **[Risk] Request delivery races with refresh cleanup** -> use page generation as the authoritative freshness boundary.
- **[Risk] Misusing `rid` for freshness** -> document and enforce that `rid` is correlation only.

## Verification

- Validate that matching `wsepoch` requests still attach successfully.
- Validate that stale `wsepoch` requests are dropped.
- Validate that requests without `wsepoch` remain compatible and log warnings.
- Validate inspect output remains stable across repeated ordinary refreshes.
