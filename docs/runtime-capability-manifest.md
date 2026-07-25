# Runtime Capability Manifest

WebSpatial runtimes can synchronously declare the complete capability set of
the exact runtime build hosting an application. The SDK uses that declaration
before falling back to the legacy shell-version matrix.

visionOS is the first provider. picoOS remains table-based until its runtime
adopts the same provider protocol.

## Resolution order

`WebSpatialRuntime.supports(name, tokens?)` keeps its existing synchronous
public API and resolves known capability queries in this order:

1. Puppeteer keeps the test-harness all-true behavior.
2. Plain browsers and SSR remain false for spatial capabilities.
3. A valid manifest whose runtime type matches the detected runtime is
   authoritative.
4. Without a usable manifest, visionOS keeps its debug-placeholder behavior and
   both runtime families fall back to `CAPABILITY_TABLE`.

A manifest is a complete allowlist. A known key omitted from `supported` is
false and does not inherit a value from a table row.

## visionOS source of truth

The current visionOS capability set is maintained in:

```text
packages/visionOS/runtime-capabilities.json
```

When a native feature changes visionOS support, update that file in the same
change. Do not add a guessed future visionOS version to
`packages/core/src/runtime/capability-data.ts`; Changesets assigns the stable
fixed-group version later.

Validate and regenerate the Swift provider with:

```bash
pnpm generate:runtime-capabilities
pnpm test:runtime-capabilities
```

The generated Swift file is checked in and included in the published visionOS
platform package. It contains only the static manifest version, runtime type, and
capability allowlist. The runtime does not read repository JSON at execution
time, and Changesets package-version updates do not require regeneration.

The runtime injects the generated manifest into each Scene WebView that loads
authored application code. SpatialDiv and Attachment WebViews only receive
portal DOM from the host React tree, so they do not receive a manifest and do
not perform independent capability detection.

## Build metadata

The builder fills `pwaManager` metadata while generating the Xcode project, and
the capability provider reads it while constructing the injected manifest:

- `manifestVersion` is maintained manually and changes only for an incompatible
  schema revision.
- `runtime.version` comes from `@webspatial/platform-visionos`.
- `runtime.buildId` uses `WEBSPATIAL_RUNTIME_BUILD_ID` when provided, otherwise
  GitHub build provenance or the installed platform package version.

Runtime version and build ID are diagnostic only. Capability truth comes only
from the complete `supported` allowlist.

## QA verification

Open the test-server `#/runtime-capabilities` page in the runtime under test.
The Environment view reports:

- detected runtime and shell version
- selected capability source
- manifest version, runtime version, and build ID
- the complete supported allowlist

For a feature PR, verify the preview SDK and preview visionOS runtime report the
PR build ID and the new capability. Also verify a legacy visionOS runtime has no
manifest and continues to use the table fallback.
