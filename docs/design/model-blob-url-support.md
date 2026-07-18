# `blob:` URL support for `<Model>` (issue #1327)

## Context

`<Model>` should accept `blob:` URLs on `src` and child `<source>` elements (models up to ~128 MB). Today source URLs are sent to native as strings, and native downloads them — which cannot resolve `blob:` (blobs only exist in the WebView's JS heap). So the bytes must be shipped JS → native. The bridge is string-only, so we transfer chunked base64 into a native temp file; the existing local-file load path handles the rest.

**Agreed decisions:** `<Model>` only; format from `<source type>` attr → `Blob.type`; transfer on-demand when native actually attempts the blob source; `currentSrc`/`onLoad` report the original blob URL.

## Design

Blob URLs pass through the existing create/update flow unchanged. When native's source-fallback loop reaches a `blob:` source:

1. **Native → JS**: new WebMsg `modelblobrequest` `{ src }`. The element loads one blob at a time, so `src` doubles as the correlation key — no separate request id.
2. **JS** (pure transport — no format logic): `fetch(src)` → blob; read 8 MiB slices, base64-encode each, send via new JSB command `TransferModelBlobData` `{ src, data, type, size }`, awaiting each call's ack before sending the next. `type`/`size` ride on every chunk (cheap next to an 8 MiB payload, and lets native resolve the extension from any chunk). The command extends `SpatializedElementCommand`, so the element `id` native routes on is supplied implicitly. A rejected ack aborts the loop. If the fetch fails (e.g. revoked blob) send `{ src, isError: true }` instead.
3. **Native**: routes each chunk to the element by `id`, then to that element's transfer by `src`; appends each decoded chunk to a temp file via `FileHandle` (order is guaranteed by the sequential acks; end-of-stream is reached when the appended byte count hits `size`). It then resolves the file extension from the mime (`<source type>` attr it already holds, falling back to the received `type`; `model/vnd.usdz+zip`→usdz, `model/gltf-binary`→glb, …), renames, and loads `Model3DAsset(url:)`; success reports the original blob URL. On error, unsupported type, or timeout (1 s per chunk), it deletes the temp file and continues the fallback loop.

Sequential acks give natural backpressure: memory stays bounded to one in-flight chunk, with no full-model buffer anywhere. Temp files are deleted on error, element reload, and element destroy. No caching in v1: two elements sharing a blob URL transfer twice.

## Changes

**packages/core**
- `WebMsgCommand.ts` — add `modelblobrequest` type + detail interface (`{ src }`).
- `JSBCommand.ts` — add `TransferModelBlobDataCommand`, extending `SpatializedElementCommand` so the element `id` is injected; payload is `{ src, data?, type?, size?, isError? }`.
- New `blob/blobTransfer.ts` — the JS half of the protocol: fetch a Blob, stream it as sequential base64 chunks, report errors. Takes the element (a `SpatialObject`) and blob URL only, so it stays component-agnostic (not Model-specific) and can back other components' blob transfers later. Separate file to keep the element class slim and the protocol unit-testable.
- `SpatializedStatic3DElement.ts` — handle `modelblobrequest` in `onReceiveEvent`; stop pumping if the element is destroyed.

**packages/react** — no code change (`getAbsoluteURL` passes blob URLs through). Add a passthrough test.

**packages/visionOS**
- `WebMsgCommand.swift` / `JSBCommand.swift` — mirror the new message and command (payload fields optional for version-skew safety; `TransferModelBlobData` decodes the injected `id` plus `{ src, data?, type?, size?, isError? }`).
- New `model/blob/BlobTransfer.swift` — native counterpart to `blobTransfer.ts`: reassembles decoded chunks into a temp file, tracks the running byte count against `size`, resolves mime → extension and renames on completion, and enforces the per-chunk timeout. Component-agnostic and no JSB knowledge — just a reassembly helper the element drives. (Placed under the `model/` synchronized group and listed in its `membershipExceptions` in `project.pbxproj`, mirroring `model/dynamic3d/`; a top-level `blob/` folder isn't a build-synced group.)
- `model/SpatializedStatic3DElement.swift` — owns the JSB communication and transfer lifecycle: sends the `modelblobrequest`, feeds incoming `TransferModelBlobData` chunks to a `BlobTransfer` keyed by `src`, exposes an async fetch that returns the temp file URL, and handles cancel/abort. Holds the temp file URLs and deletes them in `onDestroy`.
- `model/SpatialScene.swift` — register the `TransferModelBlobData` JSB listener; route each chunk to the element by `id` and ack it (a failed ack aborts the JS stream).
- `view/SpatializedStatic3DView.swift` — in the fallback loop: if `source.src` starts with `blob:`, await the element's fetch (passing the source's `type` attr) and load the returned file; return the original source string so `onLoadSuccess`/`currentSrc` report the blob URL.

## Verification

- **Manual page** `apps/test-server/src/pages/static-3d-model-blob/`: load via blob `src`, via `<source type>` (verifies type-attr precedence, now native-side), revoke-then-load (expect `onError`), blob+HTTP fallback, `loading="lazy"`; check `currentSrc`. Verify on visionOS simulator, including a large model.
