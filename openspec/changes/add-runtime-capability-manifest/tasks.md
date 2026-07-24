## 1. Manifest Source and Generation

- [ ] 1.1 Define Runtime Capability Manifest v1 TypeScript types, validation rules, and canonical serialization helpers in the core runtime module.
- [ ] 1.2 Add `packages/visionOS/runtime-capabilities.json` with the complete current visionOS allowlist and validate every entry against the SDK key/token registry.
- [ ] 1.3 Add deterministic generation that combines the checked-in source with platform package version and build provenance to produce the embedded visionOS manifest.
- [ ] 1.4 Ensure the visionOS package publishes the source/generated inputs required by the builder and add a CI drift/validation check.

## 2. SDK Capability Resolution

- [ ] 2.1 Implement internal synchronous manifest discovery, schema validation, platform matching, and page-lifetime snapshot caching without exposing a new public global API.
- [ ] 2.2 Update `supports()` precedence so a valid matching manifest wins before the visionOS debug shortcut and version table while preserving Puppeteer, SSR, non-WebSpatial, and fallback behavior.
- [ ] 2.3 Add unit tests for complete allowlist semantics, top-level/token queries, unknown entries, unsupported schema versions, malformed data, platform mismatch, repeated reads, and metadata-independent results.
- [ ] 2.4 Add regression tests proving valid manifests override `WS_SHELL_VERSION` and unusable manifests retain existing table/debug behavior.

## 3. visionOS Runtime Provider

- [ ] 3.1 Make the checked-in visionOS Xcode project and builder-generated project consume the same generated manifest representation.
- [ ] 3.2 Add a centralized document-start `WKUserScript` provider that installs a frozen, non-writable manifest value before authored application scripts.
- [ ] 3.3 Apply the provider to every primary and additional spatial/content WKWebView creation path.
- [ ] 3.4 Add native/builder tests that verify direct and generated Xcode projects embed the expected runtime type, package version, build ID, and capability allowlist.

## 4. Preview QA and Maintenance Workflow

- [ ] 4.1 Extend the runtime-capabilities test page to show provider source, manifest version, runtime version, build ID, and selected capability results.
- [ ] 4.2 Add preview verification for preview SDK + preview runtime, preview SDK + legacy runtime fallback, omitted known capabilities, and invalid manifests.
- [ ] 4.3 Document that future visionOS feature PRs update the current-capability source instead of guessing a future `CAPABILITY_TABLE` version row.
- [ ] 4.4 Add the required Changeset entries for affected fixed-group packages and describe the provider/fallback compatibility behavior.

## 5. Validation

- [ ] 5.1 Run core and builder unit tests plus repository typecheck/lint checks for all touched packages.
- [ ] 5.2 Build the visionOS platform/builder artifacts and confirm generated output is deterministic and package-complete.
- [ ] 5.3 Run AVP simulator coverage for initial-script capability queries in the primary and additional WKWebViews.
- [ ] 5.4 Verify legacy visionOS, picoOS without a provider, Puppeteer, plain browser, and SSR behavior remain unchanged.
