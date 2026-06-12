## Why

`SpatialWebEvent` previously treated each event id as a single callback slot, which caused later registrations to overwrite earlier ones. This change defines fan-out delivery for a shared id so multiple SDK subsystems can subscribe to the same native event stream without breaking each other.

## What Changes

- Allow a single `SpatialWebEvent` id to register multiple receivers at the same time.
- Dispatch each inbound event payload to every receiver currently registered for that id.
- Keep fan-out delivery running even if one receiver throws during dispatch.
- Support removing one specific receiver without affecting the remaining receivers on the same id.
- Keep `removeEventReceiver(id)` as the full-cleanup path that clears all receivers for that id.
- Remove the id entry entirely after the last receiver is removed so internal state does not retain empty containers.
- Preserve compatibility for single-receiver callers by keeping the public method names unchanged.

## Capabilities

### New Capabilities
- `spatial-web-event-receivers`: Manage registration, dispatch, and cleanup semantics for one or more receivers attached to the same `SpatialWebEvent` id.

### Modified Capabilities

## Impact

- Affects event routing in `packages/core/src/SpatialWebEvent.ts`.
- Affects SDK consumers that share ids, including `SpatializedElement`, `SpatialEntity`, `SpatialComponent`, and platform adapter callbacks.
- Affects behavior coverage in `packages/core/src/jsbcommand.coverage.test.ts`, `packages/core/src/physicalMetrics.test.ts`, and `packages/core/src/coverage-boost.test.ts`.