## Why

The SDK's version-indexed capability table requires feature authors to name the first stable shell version before Changesets has computed that version, so PR preview builds cannot accurately exercise capability detection and authors can accidentally attribute new support to an already-published runtime. A runtime-provided manifest makes capability detection describe the exact runtime build under test while preserving the existing table for runtimes that do not yet provide a manifest.

## What Changes

- Define a platform-neutral WebSpatial Runtime Capability Manifest v1 that declares the complete set of capabilities supported by a runtime build.
- Make `supports(name, tokens?)` prefer a valid manifest for the detected runtime and fall back to the existing shell-version table when no usable manifest is available.
- Add a repository-managed visionOS capability source that is validated and embedded into the visionOS runtime at build time.
- Inject the visionOS manifest synchronously before application scripts so the existing synchronous `supports()` contract remains unchanged.
- Add build metadata for diagnostics without using preview or stable versions to determine capability support.
- Keep `CAPABILITY_TABLE` as the compatibility source for legacy visionOS runtimes and current picoOS runtimes; allow picoOS to adopt the same provider protocol later without changing the public API.

## Capabilities

### New Capabilities

- `runtime-capability-manifest`: Defines the cross-platform manifest schema, validation, build metadata, provider delivery contract, and visionOS provider behavior.

### Modified Capabilities

- `runtime-capabilities`: Changes capability resolution to prefer a valid, platform-matching runtime manifest while retaining conservative table-based fallback.

## Impact

- Affects `@webspatial/core-sdk` capability resolution and tests.
- Affects the visionOS platform package, generated Xcode project content, and WKWebView initialization.
- Adds a checked-in capability source plus build-time validation/generation.
- Affects PR preview verification and release documentation, but does not change the public `supports()` signature.
- Does not require picoOS runtime changes in the first implementation.
