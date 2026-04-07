# Runtime capabilities (WebSpatial SDK)

## ADDED Requirements

### Requirement: Expose runtime identity

The WebSpatial SDK MUST provide a documented API that returns a **read-only runtime snapshot** for the current host: at minimum **`type`** (`visionOS` | `picoOS` | `web`) and **`shellVersion`** (string parsed from **`WSAppShell/...`**, or **`null`** when unavailable).

#### Scenario: SSR or no window

- **WHEN** `window` is unavailable (e.g. SSR)
- **THEN** the API MUST NOT throw solely for that reason
- **AND** **`shellVersion`** MAY be **`null`** as documented

---

### Requirement: Expose capability queries via `supports`

The WebSpatial SDK MUST provide a documented **`supports(name, tokens?)`** function that returns **`boolean`**, indicating whether the **current WebSpatial runtime** (including degraded non-spatial environments) supports the named capability, optionally constrained by **predefined sub-tokens**.

#### Scenario: Unknown top-level name

- **WHEN** `name` is not a documented capability key
- **THEN** the result MUST be **`false`**

#### Scenario: Unknown or invalid sub-token

- **WHEN** `tokens` contains a string not in the documented list for that `name`
- **THEN** the result MUST be **`false`**

#### Scenario: Sub-token AND semantics

- **WHEN** `tokens` is a non-empty array of documented sub-tokens
- **THEN** the result MUST be **`true`** only if **every** listed sub-capability is supported (**AND**)

#### Scenario: Empty tokens

- **WHEN** `tokens` is an empty array
- **THEN** behavior MUST match **omitting** `tokens` (top-level check only)

#### Scenario: No WebSpatial runtime or conservative host

- **WHEN** the host is **`web`** or capabilities are otherwise conservative per public documentation
- **THEN** **`supports`** MUST return **`false`** for Spatial-dependent keys as defined per key

---

### Requirement: Documented capability keys

The SDK MUST maintain **public documentation** listing every top-level **`name`**, optional **sub-tokens**, human-readable meaning, and when the value is **`false`** (including conservative cases).

#### Scenario: Forward compatibility for new keys

- **WHEN** a future SDK version adds new capability keys or sub-tokens
- **THEN** older applications that only check known keys MUST continue to behave as before
- **AND** unknown keys MUST still yield **`false`** for older SDKs that do not define them (or as documented for that SDK version)

---

### Requirement: Discoverability without undocumented globals

The capability API MUST be usable such that **reading capabilities** does not require the application to rely on undocumented globals; the supported entry point MUST be the exported API (e.g. **`WebSpatialRuntime`** from **`@webspatial/react-sdk`**) or a documented re-export path.

#### Scenario: Repeated reads

- **WHEN** application code calls **`supports`** or **`getRuntime`** multiple times
- **THEN** successive reads MUST return **consistent** results for the same runtime state unless the implementation explicitly documents **capability updates** (e.g. future subscribe / reconnect)
