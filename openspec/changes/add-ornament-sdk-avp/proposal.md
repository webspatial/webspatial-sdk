## Why

The Ornament public contract has been realigned to a React component model. Earlier OpenSpec artifacts still described `OrnamentProvider + useOrnament() + mountOrnament(...)` as the final developer-facing API, which no longer matches the current technical direction.

This change updates the SDK-side Ornament proposal so implementation starts from the confirmed contract:

- React developers use `<Ornament />` as the public API.
- Unsupported runtimes render nothing and do not enter a fallback portal path.
- Ornament content reuses the existing SpatialDiv style/head propagation model so CSS can inherit from the page context.
- Nested `<Ornament />` declarations inside Ornament content are not supported in the MVP.
- Spatial primitives declared inside Ornament content do not create nested native spatial instances; `enable-xr` content degrades to plain DOM, `Model` degrades to `<model>`, and `Reality` renders `null`, matching the existing Attachment boundary semantics.
- Core and native runtimes keep the finalized `create / add / update / destroy` lifecycle.

## What Changes

- Align `@webspatial/react-sdk` to expose a declarative `<Ornament />` component as the primary API.
- Keep hook-style mounting out of the final public developer contract; implementation may use internal controllers/helpers as needed.
- Add React lifecycle mapping:
  - mount: capability check -> create runtime Ornament -> add to scene -> portal children
  - props update: normalize and update runtime options
  - unmount: cleanup portal and destroy the runtime instance
- Reuse the existing SpatialDiv CSS/style sync path for Ornament portal content.
- Add MVP nesting restrictions for `<Ornament />` inside `<Ornament />` content.
- Add Ornament-content boundary handling, aligned with `AttachmentAsset`, so nested `enable-xr`, `Model`, and `Reality` declarations do not create additional native spatial instances from inside the Ornament portal.
- Add an `apps/test-server` Ornament demo page for manual validation and automated test reuse, including controls for every public Ornament prop and content modes for normal DOM plus degraded spatial primitives.
- Preserve the core lifecycle and AVP host model:
  - `SpatialSession.createOrnament(options)`
  - `SpatialScene.addOrnament(id)`
  - `Ornament.update(options)`
  - `Ornament.destroy()`
- Reuse `rid + wsepoch` spatial request metadata for `createOrnament` request correlation and page-epoch isolation.
- Explicitly remove React-side fallback rendering for unsupported runtimes.

## Capabilities

### New Capabilities

- `ornament-window-ui`: Window-level Ornament runtime lifecycle, React `<Ornament />` API, CSS inheritance through the SpatialDiv style propagation model, AVP host integration, capability gating, request correlation, and regression coverage.

### Modified Capabilities

- _(none)_

## Impact

- **Packages**:
  - `@webspatial/core-sdk`
  - `@webspatial/react-sdk`
  - `packages/visionOS`
  - `packages/autoTest`
- **Runtime behavior**:
  - Add `create / add / update / destroy` Ornament lifecycle
  - Add `WebSpatialRuntime.supports('Ornament')`
  - Add AVP window-scene Ornament host state and inspect visibility
  - Normalize `attachmentAnchor` so `topFront`, `top`, and `topBack` fall back to `bottom`
  - Preserve full 27-point `contentAlignment` support with invalid-value fallback to `back`
  - Reuse `rid + wsepoch` for create-request freshness
- **Testing**:
  - Add a test-server demo and contract-level regression coverage for component mount, update, unmount, CSS propagation, unsupported runtime null rendering, invalid-input recovery, hidden state, request freshness, basic coexistence, nested Ornament rejection, and Ornament-content spatial primitive degradation
