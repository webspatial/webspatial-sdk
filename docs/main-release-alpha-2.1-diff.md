# Main Release Notes and Alpha 2.1 Diff

This document summarizes the current `main` branch for release planning. It
covers release notes, migration guidance for breaking changes, and the user
visible diff against the public WebSpatial docs that describe the alpha 2.1
baseline.

Snapshot:

- Branch: `main`
- Commit: `e892d53d372813b140e3c7018dce2334322270db`
- Package manifests currently report `1.7.0`, while pending changesets include
  major changes for `@webspatial/react-sdk`.
- Public docs baseline:
  <https://webspatial.dev/docs/introduction/getting-started>
- Runtime baseline in public docs: alpha 2.1. In the repo capability table this
  maps closest to `PicoWebApp 0.1.1`; `main` also contains later beta and
  post-alpha capability rows.

## Executive Summary

The current `main` branch is materially ahead of the public alpha 2.1 docs.
The largest changes are:

- The React SDK public entry is now lazy and SSR-capable.
- The React SDK removes several public internals, including legacy spatial
  container factories, `SSRProvider`, and `getAbsoluteUrl`.
- Attachment APIs now use entity-style transforms and meter sizing.
- Model support is significantly expanded: playback state, multiple sources,
  poster, lazy loading, `currentTime`, `stagemode="orbit"`, and spatial event
  props are present on `main`.
- Runtime capability detection is now a first-class surface for components,
  CSS, DOM, events, JS APIs, Model subfeatures, and scene options.
- Several user-visible behavior fixes landed for portal CSS, CSS-in-JS style
  sync, SpatialDiv HMR recovery, HTML material updates, Model poster/loading,
  and scene refresh handling.

## Release Notes Draft

### Breaking Changes

#### React SDK entry points and boot flow

The default `@webspatial/react-sdk` entry is now the recommended entry for web,
SSR, RSC-compatible, and mixed 2D plus spatial React apps. It lazily loads the
spatial runtime only when a WebSpatial environment is available.

Removed or no longer public:

- `@webspatial/react-sdk/web`
- `@webspatial/react-sdk/default`
- `SSRProvider`
- Legacy spatial container factories and HOC helpers
- Internal container and monitor APIs
- `getAbsoluteUrl`

New readiness APIs:

- `SpatialBoot`
- `bootSpatial`
- `useSpatialReady`
- `isSpatialReady`
- `onSpatialLoadError`
- `WebSpatialBootError`
- `WebSpatialRuntimeError`

#### Attachment API migration

Attachments now align with entity-style transforms and meter-based sizing.

Breaking changes:

- `<AttachmentAsset name="...">` is replaced by `<AttachmentAsset id="...">`.
- `<AttachmentEntity position={[x, y, z]}>` is replaced by
  `<AttachmentEntity position={{ x, y, z }}>`.
- `<AttachmentEntity size={{ width, height }}>` in points is replaced by
  optional `width` and `height` props in meters.
- `rotation` and `scale` are now available as Vec3-style props.

#### React version and readiness semantics

React 18 or newer is required.

`useMetrics` pins its placeholder or real implementation for the lifetime of the
hook instance. Remount if an app must switch from placeholder metrics to real
runtime metrics after spatial boot.

### New Features

#### Model

`<Model>` is expanded beyond the alpha 2.1 surface. Main now includes:

- Multiple sources through nested `<source>` elements
- `poster`
- `loading="eager" | "lazy"`
- `autoPlay`
- `loop`
- `duration`
- `currentTime`
- `playbackRate`
- `paused`
- `play()`
- `pause()`
- `stagemode="none" | "orbit"`
- Spatial gesture event props

Supported model MIME types documented on `main` are:

- `model/vnd.usdz+zip`
- `model/gltf-binary`

When `stagemode="orbit"` is active, native orbit interaction owns the transform;
`entityTransform` is read-only and `onSpatial*` gesture handlers are disabled.

#### Runtime capability detection

The public runtime capability surface now covers:

- Components and component aliases
- CSS properties
- Spatial gesture events
- JS APIs
- DOM depth properties
- Scene and manifest options
- Model subfeatures

#### Scene and manifest aliases

Manifest scene configuration accepts both snake_case and camelCase keys for
scene defaults. If both spellings are present, snake_case wins. `main` also adds
the `xr_spatial_scene` scene config path alongside the existing documented
`xr_main_scene` path.

### Fixes and Behavior Changes

- CSS-in-JS portal style sync is fixed for libraries that inject CSSOM rules
  into the host document head, such as styled-components and Emotion default
  targets.
- SpatialDiv intrinsic tag selector mirroring is fixed. A selector like
  `h1[enable-xr]` can now match the probe host for an `<h1 enable-xr>`.
- Ancestor selectors still do not cross the native portal/webview boundary. Put
  stable classes or inline styles on the visible portal node.
- SpatialDiv portal recovery during linked SDK HMR is more robust.
- HTML background material updates via bracket syntax are fixed.
- Model poster, loading, duration, and DOM-linked ready/load behavior are fixed.
- VisionOS scene refresh handling now guards against stale spatial creation
  requests and can recreate a missing spatial scene from WindowGroup data.
- `<UnlitMaterial textureId>` no longer blocks material creation when the
  texture is not declared yet; it falls back to color-only and binds later when
  the texture appears.

## Migration Guide

### 1. React SDK import and boot flow

For normal web, SSR, RSC-compatible, and mixed 2D plus spatial apps, import from
the default entry and gate spatial UI behind `SpatialBoot`.

Before:

```tsx
import { Model, Reality, SSRProvider } from '@webspatial/react-sdk/default'

export function App() {
  return (
    <SSRProvider>
      <Model enable-xr src="/chair.usdz" />
    </SSRProvider>
  )
}
```

After:

```tsx
import { Model, SpatialBoot } from '@webspatial/react-sdk'

export function App() {
  return (
    <SpatialBoot>
      <Model enable-xr src="/chair.usdz" />
    </SpatialBoot>
  )
}
```

Rules:

- Replace legacy `/web` and `/default` imports.
- Replace internal container or HOC usage with JSX markers and public
  components.

### 2. Attachment API migration

Before:

```tsx
<Reality>
  <AttachmentAsset name="panel">
    <Panel />
  </AttachmentAsset>
  <World>
    <AttachmentEntity
      attachment="panel"
      position={[0, 0.2, -0.5]}
      size={{ width: 360, height: 240 }}
    />
  </World>
</Reality>
```

After:

```tsx
<Reality>
  <AttachmentAsset id="panel">
    <Panel />
  </AttachmentAsset>
  <World>
    <AttachmentEntity
      attachment="panel"
      position={{ x: 0, y: 0.2, z: -0.5 }}
      rotation={{ x: 0, y: 15, z: 0 }}
      scale={{ x: 1, y: 1, z: 1 }}
      width={0.36}
      height={0.24}
    />
  </World>
</Reality>
```

Notes:

- `width` and `height` are meters, not points.
- `position` is meters.
- `rotation` is Euler degrees.
- Attachment assets must remain direct children of `<Reality>`, outside
  `<World>` or `<SceneGraph>`.

### 3. Model migration

Alpha 2.1 Model usage still works:

```tsx
<Model enable-xr src="/robot.usdz" />
```

Use new playback and loading features when the target runtime supports them:

```tsx
<Model
  enable-xr
  poster="/robot-poster.png"
  loading="lazy"
  autoPlay
  loop
  src="/robot.usdz"
/>
```

For multiple sources:

```tsx
<Model enable-xr poster="/robot-poster.png">
  <source src="/robot.usdz" type="model/vnd.usdz+zip" />
  <source src="/robot.glb" type="model/gltf-binary" />
</Model>
```

For native orbit:

```tsx
<Model enable-xr stagemode="orbit" src="/product.usdz" />
```

Do not attach custom spatial drag, rotate, magnify, or tap handlers to a Model
in orbit mode. The native orbit interaction owns the transform.

### 4. Portal CSS migration

Selectors scoped through ancestors may fail once content is rendered in a child
portal/webview. Move styling to a class on the visible node or use inline style.

Fragile:

```css
.card .menu {
  border-radius: 12px;
}
```

Preferred:

```tsx
<div enable-xr className="spatial-menu" />
```

```css
.spatial-menu {
  border-radius: 12px;
}
```

## Public Alpha 2.1 Docs vs Main

| Area                      | Public alpha 2.1 docs                                                                                                                            | Current `main`                                                                                                                                                                                                   | Migration or docs action                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Getting started           | Install React SDK; configure JSX runtime; SSR docs mention `Context`/`SSRProvider`.                                                              | Public React entry is lazy and SSR-capable; `SpatialBoot` and readiness APIs replace `SSRProvider`; React 18+ required.                                                                                          | Update getting-started docs to recommend the public entry plus `SpatialBoot`.                  |
| Import paths              | Public docs mostly show `@webspatial/react-sdk` and package-level installs.                                                                      | `/web` and `/default` entries are removed from the public API.                                                                                                                                                   | Add import-path migration table.                                                               |
| RSC and SSR               | Public docs mention SSR setup but do not describe lazy facades or RSC-safe imports.                                                              | Default entry exports client facades and is compatible with SSR/RSC import patterns; no public `/server` helper in v1.                                                                                           | Document request-time runtime branching through User-Agent or runtime detection on the client. |
| JSX markers               | Docs describe `enable-xr`, `__enableXr__`, `style={{ enableXr: true }}`, and `enable-xr-monitor`.                                                | Marker model remains the preferred path. Internal containers/HOCs are no longer public. Intrinsic tag selector mirroring is fixed.                                                                               | Keep marker docs; remove or avoid internal container guidance.                                 |
| Model API                 | Docs list `src`, `onLoad`, `onError`, `currentSrc`, `ready`, and `entityTransform`.                                                              | Adds `<source>`, `poster`, `loading`, `autoPlay`, `loop`, `duration`, `currentTime`, `playbackRate`, `paused`, `play()`, `pause()`, `stagemode`, and spatial events.                                             | Expand Model docs and add runtime support rows for each subfeature.                            |
| Model file types          | Docs imply static 3D model loading but do not clearly list all current source behaviors.                                                         | Main docs list `model/vnd.usdz+zip` and `model/gltf-binary`; USD and glTF text docs were removed.                                                                                                                | Document supported MIME types and source selection behavior.                                   |
| Model orbit               | Not in alpha 2.1 docs.                                                                                                                           | `stagemode="orbit"` enables native orbit drag rotation.                                                                                                                                                          | Add usage notes and warn that spatial gesture props are disabled in orbit mode.                |
| Reality components        | Docs list Reality, Material, ModelAsset, AttachmentAsset, World, Entity, primitives, ModelEntity, and AttachmentEntity.                          | Public facade exports aliases such as `Box`, `Sphere`, `Cone`, `Cylinder`, `Plane`, `World`, plus entity variants. `Texture` and `UnlitMaterial` behavior are improved.                                          | Update component inventory and examples.                                                       |
| Attachment API            | Docs say AttachmentEntity currently supports `position` and `size`; future versions will add full transform props.                               | The future API is now the breaking API: `id`, object `position`, meter `width`/`height`, `rotation`, and `scale`.                                                                                                | Replace alpha attachment examples and add a migration section.                                 |
| CSS `background-material` | Docs list `translucent`, `transparent`, and `none`.                                                                                              | The current style surface also includes `thick`, `regular`, and `thin`.                                                                                                                                          | Verify platform support before documenting as portable; otherwise document as conditional.     |
| CSS transform/back/depth  | Docs cover `back`, spatial transforms, `background-material`, and `--xr-depth`.                                                                  | Behavior remains, with additional portal/CSS quirks documentation and selector fixes.                                                                                                                            | Add portal boundary caveats and CSS-in-JS support notes.                                       |
| CSS-in-JS                 | Getting-started docs state the latest version has a styled-components bug.                                                                       | CSSOM head sync fixes are present on `main`.                                                                                                                                                                     | Remove stale warning after release validation.                                                 |
| DOM depth APIs            | Docs list User-Agent, `xrOffsetBack`, `xrClientDepth`, and `xrInnerDepth`.                                                                       | Runtime keys also include `xrOuterDepth`.                                                                                                                                                                        | Decide whether `xrOuterDepth` is public and document if yes.                                   |
| Spatial events            | Docs cover spatial tap, drag, magnify, and rotate.                                                                                               | Event surface remains, with capability subkeys such as constrained rotate axis and Model spatial event props.                                                                                                    | Add capability-gated event support table.                                                      |
| JS APIs                   | Docs list `initScene`, `useMetrics`, and `convertCoordinate`.                                                                                    | React SDK now also exposes runtime readiness and capability detection APIs.                                                                                                                                      | Add runtime detection and readiness docs; update `useMetrics` readiness caveat.                |
| Manifest and scene config | Docs cover `xr_main_scene` and scene options such as type, default size, resizability, world scaling, world alignment, and baseplate visibility. | Main adds alias handling, `xr_spatial_scene`, camelCase/snake_case support, `worldAlignment: "adaptive"`, and `baseplateVisibility: "visible"`.                                                                  | Update manifest schema docs and document precedence when both spellings exist.                 |
| Platform matrix           | Docs state visionOS and PICO OS 6 are supported.                                                                                                 | Capability data distinguishes visionOS 1.5/1.6/1.7 and Pico alpha2.1, beta2.0, and beta2.1 rows. Entity animation is intentionally excluded from this DC release because PicoOS runtime support is not included. | Publish a versioned capability matrix instead of a single support statement.                   |

## Capability Highlights After Alpha 2.1

These are the most visible deltas from alpha 2.1:

| Feature                                                           | Main branch status       | Notes                                                                |
| ----------------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------- |
| [Cross-platform feature detection API](./runtime-capabilities.md) | Present                  | Use runtime capability keys instead of hardcoding platform versions. |
| [React SDK distribution for SSR/RSC](./react-sdk-distribution.md) | Present                  | Public React entry is lazy and SSR/RSC-capable.                      |
| [`onSpatialContentReady` reliability](./spatial-content-ready.md) | Improved                 | Still depends on connected DOM and spatial host readiness.           |
| Textures                                                          | Present in public facade | `UnlitMaterial textureId` fallback behavior improved.                |
| Model `currentTime`                                               | Present                  | Capability-gate per runtime.                                         |
| Model poster                                                      | Present                  | Fixes landed for poster display when no sources are active.          |
| Model loading                                                     | Present                  | Supports eager and lazy loading modes.                               |
| Model orbit stage mode                                            | Present                  | `stagemode="orbit"` disables custom spatial gesture handlers.        |

## Release Checklist

- Decide final package version after applying pending changesets.
- Confirm whether this release should be branded as a major React SDK release
  because of the lazy-entry and attachment API breaks.
- Validate runtime capability table against the final native shells that will
  ship with the release.
- Update public docs for getting started, Model, AttachmentEntity, manifest
  aliases, and CSS-in-JS. Runtime detection, SSR/RSC distribution, and
  `onSpatialContentReady` now have draft API docs in this repo.
- Remove the stale styled-components warning from the public getting-started
  page after release validation.
- Decide whether `xrOuterDepth`, extra background material values, and
  `boundingBoxCenter`/`boundingBoxExtents` are public for this release or should
  remain internal/future-facing.

## Source Map

Local sources:

- `.changeset/attachment-asset-id.md`
- `.changeset/react-sdk-lazy-load-major.md`
- `.changeset/model-stagemode-orbit.md`
- `docs/migration/lazy-load-spatial-runtime.md`
- `docs/react-sdk-distribution.md`
- `docs/runtime-capabilities.md`
- `docs/spatial-content-ready.md`
- `docs/Attachments.md`
- `docs/Model.md`
- `docs/webspatial-quirks.md`
- `packages/react/src/index.ts`
- `packages/react/src/Model.tsx`

Public docs compared:

- <https://webspatial.dev/docs/introduction/getting-started>
- <https://webspatial.dev/docs/react/overview>
- <https://webspatial.dev/docs/react/model>
- <https://webspatial.dev/docs/react/reality>
- <https://webspatial.dev/docs/css/overview>
- <https://webspatial.dev/docs/dom/overview>
- <https://webspatial.dev/docs/event/overview>
- <https://webspatial.dev/docs/js/overview>
- <https://webspatial.dev/docs/manifest/main_scene>
