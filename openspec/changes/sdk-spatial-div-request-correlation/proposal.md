# Proposal: SDK SpatialDiv request correlation

## Why

SpatialDiv and attachment creation need two independent signals:

- `rid`: request correlation for async completion and logging.
- `wsepoch`: page ownership metadata used by host runtimes for freshness checks.

The SDK should keep `rid` as the only request-correlation field in this rollout, while making its generated value refresh-safe and opaque in practical usage. This preserves compatibility with existing host integrations and lets upgraded hosts reject stale requests when `wsepoch` is available.

## What Changes

- Generate refresh-safe opaque `rid` values for SpatialDiv and attachment requests.
- Emit `wsepoch` when the host exposes page epoch metadata to the SDK.
- Keep request completion keyed by `rid`.
- Update frontend platform adapters to emit `rid` and optional `wsepoch` consistently.
- Add tests for `rid` refresh safety and emitted request metadata.

## Boundaries

- This change covers frontend SDK request construction and callback correlation only.
- This change does not define native stale-rejection behavior; host runtimes decide how to consume `wsepoch`.
- This change does not introduce a new request-correlation field name.

## Capabilities

### New Capabilities

- `spatial-div-request-correlation`: specifies refresh-safe `rid` generation and optional `wsepoch` emission for frontend-created SpatialDiv requests.

### Modified Capabilities

- None.

## Impact

- `packages/core/src/platform-adapter/*`
- `packages/core/src/scene-polyfill.ts`
- `packages/core/src/types/global.ts`
- frontend request / callback tests
