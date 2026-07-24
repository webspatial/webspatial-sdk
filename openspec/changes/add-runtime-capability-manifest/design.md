## Context

`supports(name, tokens?)` currently selects a `CAPABILITY_TABLE` row from the runtime family and shell semver. This is workable for runtime releases whose version is known in advance, but visionOS runtime and SDK packages are a Changesets fixed group. A feature PR therefore knows the implementation and capability surface but not the final stable version that will be assigned after other Changesets are aggregated.

PR preview packages compound the problem: QA can exercise the new native implementation, but table-based capability detection either remains false, guesses a future stable version, or uses the `WS_SHELL_VERSION` debug shortcut that returns true for every known key. None verifies the production feature-detection contract.

The original runtime-capabilities design already reserved a runtime-provided manifest as the long-term alternative to coarse shell-version inference. This change makes that provider protocol concrete, implements visionOS as its first provider, and preserves the table for existing runtimes.

## Goals / Non-Goals

**Goals:**

- Make `supports()` report the capability surface of the exact visionOS runtime build used in a PR preview without knowing its future stable semver.
- Define a platform-neutral, synchronously available manifest contract that picoOS can adopt later.
- Keep existing applications and runtimes working through conservative table fallback.
- Maintain one Git-managed visionOS capability source and validate it against the SDK capability registry.
- Make preview/stable build provenance observable without allowing version or build metadata to affect capability decisions.

**Non-Goals:**

- Change the public `supports(name, tokens?)` signature or expose the internal runtime snapshot.
- Require picoOS to provide a manifest in the first implementation.
- Treat the manifest as a security boundary or an authorization mechanism.
- Dynamically refresh capabilities during a page session.
- Generate a public historical product matrix from stable releases; that reporting workflow can consume the same source later.

## Decisions

### 1. Use a complete, platform-neutral allowlist

Manifest v1 contains:

```json
{
  "manifestVersion": 1,
  "runtime": {
    "type": "visionos",
    "version": "1.7.0",
    "buildId": "pr-1234-a1b2c3d"
  },
  "supported": [
    "Model",
    "Model:play",
    "useAnimation",
    "useAnimation:entity"
  ]
}
```

`supported` is a complete allowlist for capability names known by the consuming SDK. A known top-level key or compound `name:token` entry absent from the list is false. Unknown entries are ignored so a newer runtime can be consumed safely by an older SDK.

A complete allowlist is preferred over partial overrides because partial data can inherit stale `true` values from a historical table row when a runtime removes or temporarily disables support.

`runtime.type` makes the provider platform explicit and prevents a manifest from one runtime family being applied to another. The schema is not named after visionOS so picoOS can implement the same contract without another SDK API.

### 2. Keep source data separate from generated build metadata

The repository owns a visionOS source file, initially `packages/visionOS/runtime-capabilities.json`, containing:

- `manifestVersion`
- runtime type
- the canonical sorted `supported` allowlist

The source does not contain a stable package version or a hard-coded build ID. A build step validates the source against the SDK key/token registry and produces the embedded manifest with:

- `runtime.version` from `@webspatial/platform-visionos/package.json`
- `runtime.buildId` from build provenance

`manifestVersion` is an integer protocol version maintained deliberately in source. It changes only when parsing semantics become incompatible; adding backward-compatible optional metadata does not require a bump.

`buildId` is generated, non-empty diagnostic metadata. CI uses a channel plus source revision, for example `pr-1234-a1b2c3d`, `main-a1b2c3d`, or `stable-v2.0.0-a1b2c3d`. Local builds fall back to `local-<short-sha>` when Git metadata is available and a deterministic local fallback otherwise. Neither `runtime.version` nor `buildId` participates in capability resolution.

A content-derived `capabilitySetId` is deferred. It can be added as optional metadata later if cross-build equality of capability sets becomes operationally useful.

### 3. Embed at build time; do not read repository JSON at runtime

The visionOS application does not open the source JSON from the filesystem. The platform build/builder flow converts the validated source and generated metadata into a Swift or JavaScript literal carried by the runtime artifact.

The generated Xcode project and the checked-in platform project must consume the same generated representation. CI verifies generation is deterministic and that checked-in generated output, if any, is not stale.

This avoids runtime path and bundle-resource failures and ensures the manifest being injected is the one reviewed with the native implementation.

### 4. Inject before application scripts in every WebSpatial WKWebView

The visionOS provider installs an internal `WKUserScript` at `WKUserScriptInjectionTime.atDocumentStart` for every WebSpatial WKWebView configuration, including additional spatial/content webviews.

The script defines an internal, frozen manifest value before authored scripts execute. Applications continue to use `WebSpatialRuntime.supports`; the injected global is a provider-to-SDK implementation contract, not a new application-facing API.

Synchronous document-start delivery is required because `supports()` and lazy-load gating are synchronous. An asynchronous JSB request would introduce races and require a public API change.

### 5. Prefer a valid matching manifest, then preserve existing fallbacks

Capability resolution order is:

1. Reject unknown SDK capability names or tokens as today.
2. Preserve the Puppeteer test-harness all-true behavior.
3. Preserve non-WebSpatial/SSR false behavior.
4. For a detected visionOS or picoOS runtime, snapshot and validate a matching supported manifest.
5. If valid, resolve exclusively from its complete allowlist.
6. If absent, unsupported, malformed, or platform-mismatched, use existing behavior: visionOS debug-placeholder handling followed by the shell-version table.

Manifest lookup therefore occurs before the visionOS `WS_SHELL_VERSION` debug shortcut. A preview runtime with a valid manifest exercises precise capability detection instead of returning true for every known key.

The SDK snapshots the validated manifest for the page lifetime so repeated reads stay stable. Invalid provider data does not throw into application code.

### 6. Treat the version table as a compatibility layer

Existing visionOS rows remain for runtimes released without a manifest. Once the provider ships, feature authors update the visionOS current-capability source rather than guessing a future row version.

For a manifest-capable runtime, semver remains useful for diagnostics and release identification but is not an input to capability truth. If manifest delivery fails, table fallback is deliberately conservative: new features remain false rather than being attributed to an older release.

picoOS continues using `CAPABILITY_TABLE.picoos` until its runtime can synchronously provide the common manifest. Its later migration requires a provider implementation and source ownership decision, not another change to `supports()`.

### 7. Verify preview and compatibility combinations

Automated and QA coverage includes:

- preview SDK + preview visionOS runtime: new declared capability is true
- preview SDK + older visionOS runtime: new capability is false through table fallback
- valid manifest with a known omitted capability: false
- valid manifest with unknown future entries: known entries still resolve correctly
- missing, malformed, unsupported-version, or platform-mismatched manifest: no throw and table fallback
- valid manifest plus `WS_SHELL_VERSION`: manifest wins
- Puppeteer, SSR, non-WebSpatial, and repeated-read behavior remain unchanged

QA surfaces the parsed runtime type, version, build ID, manifest version, provider/fallback source, and selected capability results so the tested artifact is unambiguous.

## Risks / Trade-offs

- **[Risk] Source capability declarations drift from native implementation** → Validate keys and generated output in CI, require native feature PRs to update the source, and cover declared capabilities with targeted integration tests.
- **[Risk] Manifest injection is missing from one WKWebView creation path** → Centralize provider installation in WKWebView configuration and test both primary and spatial/content webviews.
- **[Risk] Authored JavaScript tampers with the internal global** → Inject first, freeze the manifest, define the property as non-writable/non-configurable where practical, and snapshot validated data. Capability detection remains advisory rather than a security boundary.
- **[Risk] A malformed manifest hides all new capabilities** → Fall back without throwing and expose the selected provider source in the diagnostic test page.
- **[Risk] Older SDKs do not understand manifests** → They retain their existing table behavior; newer capability names are already unknown/false to them.
- **[Trade-off] Complete manifests are larger than deltas** → The capability registry is small, and deterministic correctness is worth the small injected payload.
- **[Trade-off] New manifest-capable visionOS releases are not represented by manually authored table rows** → The table remains a legacy compatibility mechanism; a separate release-reporting generator can snapshot current manifests if a historical product matrix is required.

## Migration Plan

1. Add manifest schema/types, validation, snapshot caching, and resolution precedence to the SDK while retaining every existing fallback.
2. Add the checked-in visionOS capability source and deterministic validation/generation tooling.
3. Install the generated provider in every visionOS WKWebView at document start.
4. Add unit, builder, native, and preview QA coverage before treating the provider as authoritative.
5. Document the cutover: future visionOS capability changes update the current source rather than a guessed `CAPABILITY_TABLE` row.
6. Roll back safely by disabling/removing provider injection; updated SDKs then resume existing table behavior.

## Open Questions

- Whether stable-release reporting needs a generated version-to-capability history in the same change or can remain a follow-up; it is not required for runtime correctness.
