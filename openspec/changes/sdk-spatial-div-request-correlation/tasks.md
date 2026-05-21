# Tasks: sdk-spatial-div-request-correlation

## 1. Request metadata contract

- 1.1 Define internal helper for creating refresh-safe opaque `wsrid` values.
- 1.2 Define internal helper for reading the current page epoch from host-injected SDK state.
- 1.3 Document `wsrid` as opaque request identity and `wsepoch` as page ownership metadata.

## 2. Platform adapters

- 2.1 Update PicoOS SpatialDiv creation protocol URL to include `wsrid` and `wsepoch`.
- 2.2 Update PicoOS attachment creation protocol URL to include `wsrid` and `wsepoch`.
- 2.3 Preserve compatibility with the legacy `rid` callback key during migration.
- 2.4 Update VisionOS frontend protocol URL construction to include the same metadata fields.

## 3. Pending receiver cleanup

- 3.1 Add timeout cleanup for pending creation request receivers.
- 3.2 Ensure timeout removes the receiver exactly once.
- 3.3 Ensure successful native callback clears the timeout and removes the receiver.

## 4. Tests

- 4.1 Add tests that `wsrid` does not collide across simulated page reload / module reinitialization.
- 4.2 Add tests that emitted protocol URLs contain `wsrid` and `wsepoch` when epoch is available.
- 4.3 Add tests that missing epoch still emits a valid `wsrid`.
- 4.4 Add tests for pending receiver timeout cleanup.

## 5. Verification

- 5.1 Run targeted `packages/core` unit tests.
- 5.2 Run package typecheck/build for `@webspatial/core-sdk` if available.
