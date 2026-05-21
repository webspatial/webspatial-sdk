# Design: SDK SpatialDiv request correlation

## Context

The frontend SDK constructs SpatialDiv and attachment requests before native hosts see them. Hosts already understand `rid` as the request correlation value, while upgraded hosts may additionally consume `wsepoch` for freshness checks.

The SDK should therefore keep `rid` as the request-correlation field and make it refresh-safe, while emitting `wsepoch` only when page epoch information is available.

## Goals / Non-Goals

**Goals:**

- Keep `rid` as the only request-correlation field in this rollout.
- Make emitted `rid` values refresh-safe and opaque in practical usage.
- Emit `wsepoch` when host-provided page epoch is available.
- Keep callback correlation keyed by `rid`.
- Preserve compatibility with hosts that do not consume `wsepoch` yet.

**Non-Goals:**

- This change does not make native stale-rejection decisions.
- This change does not require hosts to parse the internal structure of `rid`.
- This change does not add a second request-correlation field.

## Decisions

### Decision 1: `rid` remains the request-correlation field

The SDK SHALL continue to emit `rid` for SpatialDiv and attachment requests. `rid` is the only request-correlation field in this rollout.

### Decision 2: `rid` becomes refresh-safe and opaque

The SDK MAY build `rid` from a per-JavaScript-context nonce plus an incremental sequence, or an equivalent strategy that avoids practical collisions across page reloads.

Hosts MUST treat `rid` as an opaque string and MUST NOT depend on its internal structure.

### Decision 3: `wsepoch` is optional page ownership metadata

If the host exposes page epoch metadata to JavaScript, the SDK SHALL emit that value as `wsepoch`.

If page epoch metadata is unavailable, the SDK SHALL omit `wsepoch` and still emit a valid `rid`.

### Decision 4: Callback correlation stays on `rid`

Frontend completion and timeout handling SHALL continue to use `rid` as the correlation key.

This keeps compatibility with hosts that still complete requests through `rid` only.

### Decision 5: Request URLs carry `rid` and optional `wsepoch`

The SDK SHALL emit request URLs in the following form:

```text
webspatial://createSpatialized2DElement?rid=<opaque-rid>&wsepoch=<epoch>
webspatial://createAttachment?rid=<opaque-rid>&wsepoch=<epoch>
```

When page epoch is unavailable, the `wsepoch` query parameter may be absent.

## Compatibility

- Hosts that do not consume `wsepoch` remain compatible because request completion still uses `rid`.
- Full stale-request rejection requires the host path to preserve and consume `wsepoch` end to end.
- Upgrading the SDK alone preserves compatibility but does not guarantee stale-request rejection on older host paths.

## Risks / Trade-offs

- **[Risk] Hidden host assumptions about `rid` format** -> keep `rid` opaque but stable as a string field, and verify with targeted tests.
- **[Risk] Host path drops `wsepoch`** -> preserve compatibility by continuing to complete through `rid`.
- **[Risk] Overloading `rid` semantics** -> keep `rid` strictly for correlation and `wsepoch` strictly for page ownership.

## Verification

- Add tests that generated `rid` values do not collide across simulated page reload / module reinitialization.
- Add tests that emitted request URLs contain `rid` and `wsepoch` when page epoch is available.
- Add tests that missing page epoch still emits a valid `rid` and preserves callback correlation.
