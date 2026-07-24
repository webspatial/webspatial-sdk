## ADDED Requirements

### Requirement: Runtime Capability Manifest v1 schema

A WebSpatial runtime capability provider MUST expose a manifest with `manifestVersion: 1`, a runtime descriptor, and a complete `supported` allowlist. The runtime descriptor MUST contain a provider type of `visionos` or `picoos` and a non-empty diagnostic `buildId`; it MAY contain a diagnostic runtime version. Each allowlist entry MUST be either a canonical top-level capability name or a canonical `name:token` compound key defined by the SDK capability registry.

#### Scenario: Valid v1 manifest

- **WHEN** a manifest has `manifestVersion: 1`, a supported runtime type, a non-empty `buildId`, and only canonical allowlist entries
- **THEN** the SDK MUST accept it as a valid candidate for the matching detected runtime

#### Scenario: Unknown future capability entry

- **WHEN** a valid manifest contains an allowlist entry not known by the consuming SDK
- **THEN** the SDK MUST ignore that entry without invalidating known entries

#### Scenario: Complete allowlist semantics

- **WHEN** a valid manifest omits a capability name or compound key known by the consuming SDK
- **THEN** that omitted capability or sub-capability MUST resolve to `false`
- **AND** the SDK MUST NOT inherit its value from a shell-version table row

### Requirement: Manifest compatibility validation

The SDK MUST use a runtime manifest only when its schema version is supported, its data is well formed, and its runtime type matches the detected runtime type. Provider validation failures MUST NOT throw into application code.

#### Scenario: Unsupported manifest version

- **WHEN** the runtime exposes a manifest whose `manifestVersion` is not supported by the SDK
- **THEN** the SDK MUST ignore the manifest and use its documented fallback capability source

#### Scenario: Platform-mismatched manifest

- **WHEN** runtime detection reports `picoos` but the manifest declares `visionos`, or vice versa
- **THEN** the SDK MUST ignore the manifest and use its documented fallback capability source

#### Scenario: Malformed manifest

- **WHEN** an injected manifest is missing required fields or contains invalid field types
- **THEN** capability queries MUST NOT throw because of the malformed data
- **AND** the SDK MUST use its documented fallback capability source

### Requirement: Build metadata is diagnostic only

`manifestVersion` MUST be maintained as the compatibility version of the manifest schema and MUST NOT be generated from package semver. `runtime.version` and `runtime.buildId` MUST be diagnostic metadata and MUST NOT affect the truth value of a capability query.

#### Scenario: Preview and stable builds have the same capabilities

- **WHEN** two valid manifests have identical supported allowlists but different runtime versions or build IDs
- **THEN** all known capability queries MUST return the same results for both manifests

#### Scenario: Build ID generation

- **WHEN** a visionOS runtime artifact is built
- **THEN** its manifest MUST contain a non-empty build ID generated from available build provenance
- **AND** the checked-in capability source MUST NOT hard-code a preview or stable build ID

#### Scenario: Schema version changes deliberately

- **WHEN** a build is produced without an incompatible manifest schema change
- **THEN** the build process MUST preserve the checked-in manifest version rather than incrementing it automatically

### Requirement: Synchronous stable provider delivery

A runtime capability provider MUST make its manifest available synchronously before authored application scripts execute and MUST keep the effective manifest stable for the page lifetime.

#### Scenario: Application queries during initial execution

- **WHEN** application code calls `supports()` during its initial synchronous execution
- **THEN** the SDK MUST be able to resolve from the provider without awaiting a native message or network request

#### Scenario: Repeated reads

- **WHEN** application code performs repeated capability queries during the same page lifetime
- **THEN** the SDK MUST resolve them from the same validated manifest snapshot

### Requirement: Repository-managed visionOS provider source

The visionOS platform package MUST contain a Git-managed current-capability source with the manifest version, `visionos` runtime type, and complete supported allowlist. The visionOS build flow MUST validate this source against the SDK registry and embed generated manifest data into the runtime artifact; the runtime MUST NOT depend on reading the repository source path at execution time.

#### Scenario: Native feature PR updates support

- **WHEN** a visionOS feature changes the runtime's supported capability surface
- **THEN** the same change MUST update the current-capability source
- **AND** validation MUST reject unknown names, invalid tokens, or duplicate entries

#### Scenario: Runtime artifact is built

- **WHEN** the visionOS platform package is converted into an Xcode project or built directly
- **THEN** the resulting artifact MUST contain manifest data generated from the checked-in source
- **AND** the result MUST not depend on the source JSON being accessible from a repository filesystem at runtime

### Requirement: visionOS document-start injection

The visionOS runtime MUST install the generated manifest in every WebSpatial WKWebView JavaScript environment before authored scripts execute. The injected value MUST be protected against ordinary reassignment where the platform permits.

#### Scenario: Primary WebSpatial WKWebView

- **WHEN** the runtime creates the primary WebSpatial WKWebView
- **THEN** it MUST install the manifest with document-start injection before loading application content

#### Scenario: Additional WebSpatial WKWebView

- **WHEN** the runtime creates an additional spatial or content WKWebView
- **THEN** it MUST install the same runtime-build manifest before loading that webview's authored content

### Requirement: Provider protocol is platform-neutral

The manifest schema and SDK consumer MUST support both `visionos` and `picoos` provider types without changing the public `supports()` API. A platform that does not yet provide a manifest MUST remain supported through the existing fallback mechanism.

#### Scenario: picoOS has not migrated

- **WHEN** the detected runtime is picoOS and no picoOS manifest is present
- **THEN** the SDK MUST continue resolving capabilities from the picoOS shell-version table

#### Scenario: Future picoOS provider

- **WHEN** picoOS later provides a valid matching v1 manifest synchronously
- **THEN** the existing SDK manifest consumer MUST be able to resolve it without a new application-facing API
