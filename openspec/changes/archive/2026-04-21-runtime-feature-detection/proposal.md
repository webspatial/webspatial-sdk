## Why

Developers integrate the same WebSpatial SDK across visionOS WebKit, PICO, and plain browsers, but capabilities differ by **WebSpatial runtime** (native bridge, polyfills, degraded mode). Today there is no first-class way to query **which SDK features are actually available** in the current environment, which leads to trial-and-error, defensive code, and poor UX when a feature is unsupported.

## What Changes

- Introduce **`WebSpatialRuntime`** (exported from **`@webspatial/react-sdk`**) with:
  - **`supports(name, tokens?)`** — boolean capability checks with **documented** top-level keys and **optional predefined sub-tokens** (AND semantics).
- Keep `getRuntime()` as an **internal function** (not external API), with runtime snapshot type **`'visionos' | 'picoos' | null`** plus shell version.
- Define a **stable naming scheme** and a **Shell-versioned capability table** shipped in the SDK; keys align with **`supports`** strings (see **`review.md`**).
- Document **resolution rules** (`type === null`, unparseable shell, table fallback) and **application fallback** conventions (see **`review.md`** §4–§5).
- **No breaking change** to existing public APIs in this proposal; additive exports unless implementation discovers unavoidable coupling.

## Capabilities

### New Capabilities

- `runtime-capabilities`: Documented `supports` contract, key lists, sub-tokens, SSR behavior, and forward compatibility for new keys.

### Modified Capabilities

- _(none — repository `openspec/specs/` has no archived baseline for this repo; this change introduces a new capability spec under the change.)_

## Impact

- **Packages**: **`@webspatial/core-sdk`** (resolution, table, parsing) and **`@webspatial/react-sdk`** (primary `WebSpatialRuntime.supports` export).
- **Apps**: Branch on **`supports`**; optional test-server debug panel.
- **Docs**: Public API + **[`review.md`](./review.md)** (TOC: [`#review-contents`](./review.md#review-contents)) as the engineering review anchor.
