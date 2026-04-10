## Why

The repository already documents `xr_spatial_scene` as a declarative manifest entry point, but real-world manifests mix snake_case and camelCase keys. This change formalizes alias handling so existing manifests resolve predictably and per-scene overrides continue to work without forcing developers to rewrite configuration files.

## What Changes

- Accept both snake_case and camelCase aliases for supported `xr_spatial_scene` fields on the same manifest object.
- Define that snake_case wins when both alias forms are present in the same object layer.
- Accept both `window_scene` and `windowScene`, and both `volume_scene` and `volumeScene`, inside `overrides`.
- Normalize supported manifest aliases into the runtime camelCase shape before they are exposed through manifest-derived defaults.
- Preserve existing priority rules across built-in defaults, top-level manifest values, per-scene overrides, and `initScene()` callback returns.
- Preserve callback chaining behavior so repeated `initScene()` calls for the same scene name still receive the previous callback return value unchanged.

## Capabilities

### New Capabilities
- `manifest-scene-config`: Resolve `xr_spatial_scene` defaults and overrides from manifest input with defined alias and precedence rules.

### Modified Capabilities

## Impact

- Affects manifest parsing and scene default resolution in `packages/core/src/scene-polyfill.ts`.
- Affects type exposure for manifest aliases in `packages/core/src/types/global.d.ts`.
- Affects manifest behavior tests in `packages/core/src/scene-polyfill.manifest.test.ts`.
- Affects public documentation in `docs/manifest-api.md`.