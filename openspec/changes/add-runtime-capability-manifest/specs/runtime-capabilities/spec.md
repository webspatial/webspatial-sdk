## ADDED Requirements

### Requirement: Runtime manifest capability resolution precedence

For detected visionOS and picoOS runtimes, `supports(name, tokens?)` MUST prefer a valid platform-matching Runtime Capability Manifest over shell-version table inference. Manifest resolution MUST preserve the existing synchronous API, documented name/token validation, Puppeteer behavior, non-WebSpatial behavior, and page-lifetime consistency.

#### Scenario: Valid manifest takes precedence

- **WHEN** the detected runtime is visionOS or picoOS and a valid matching manifest is available
- **THEN** `supports()` MUST resolve every known capability query exclusively from the manifest's complete allowlist
- **AND** shell version, runtime version, and build ID MUST NOT change that result

#### Scenario: Manifest precedes visionOS debug shortcut

- **WHEN** the detected runtime is visionOS, its shell version is `WS_SHELL_VERSION`, and a valid matching manifest is available
- **THEN** `supports()` MUST resolve from the manifest
- **AND** a known capability omitted from the manifest MUST return `false`

#### Scenario: No usable manifest

- **WHEN** no manifest is present, or the available manifest is malformed, unsupported, or platform-mismatched
- **THEN** `supports()` MUST preserve the existing visionOS debug-placeholder and shell-version table behavior

#### Scenario: Puppeteer behavior is unchanged

- **WHEN** the detected runtime type is `puppeteer`
- **THEN** every documented capability query MUST continue to return `true`
- **AND** a runtime manifest MUST NOT narrow the Puppeteer test-harness behavior

#### Scenario: Non-WebSpatial behavior is unchanged

- **WHEN** the detected runtime type is `null`
- **THEN** every spatial-dependent capability query MUST continue to return `false`
- **AND** an authored page value resembling a runtime manifest MUST NOT cause the page to be classified as WebSpatial

#### Scenario: Top-level and token queries use the same snapshot

- **WHEN** application code queries a top-level capability and one or more of its documented sub-tokens
- **THEN** all results MUST be calculated from the same selected manifest or fallback table snapshot
