# Double-click Probe for `window.open("webspatial://...")`

This is a standalone visionOS Xcode project for reproducing a `WKWebView` double-click synthesis issue seen when a child window is created with a custom `webspatial://` initial URL.

## Run

Open the project:

```sh
open apps/double-click-probe-visionos/DoubleClickProbe.xcodeproj
```

Then select the `DoubleClickProbe` scheme and run it on an Apple Vision Pro simulator.

You can also build from the command line:

```sh
xcodebuild -project apps/double-click-probe-visionos/DoubleClickProbe.xcodeproj -scheme DoubleClickProbe -destination 'generic/platform=visionOS Simulator' build
```

## How to verify

1. Select a demo from the sidebar.
2. Wait for the child `WKWebView` to appear when the demo uses `window.open`.
3. Double click or double tap the probe button inside the root and child web views.
4. Inspect Xcode console logs prefixed with `[DoubleClickProbe]`.

A working path should show `click detail=2` followed by `dblclick detail=2`. A reproducing path receives lower-level interaction events but misses the synthesized `dblclick` sequence on the child `WKWebView`.

## Demo matrix

| Demo | `window.open` URL | Host shape | React | Expected |
| --- | --- | --- | --- | --- |
| demo0 | no `window.open` | direct root + SwiftUI ornament | no | `dblclick` works |
| demo1 | `about:blank` | `createWebViewWith` + ornament | no | `dblclick` works |
| demo2 | `about:blank` | ornament + WebSpatial-like body style | no | `dblclick` works |
| demo3 | `webspatial://createOrnament?...` | ornament + WebSpatial-like body style | no | confirm locally; expected to miss `dblclick` |
| demo4 | `about:blank` | ornament + head/style/class sync | no | `dblclick` works |
| demo5 | `about:blank` | ornament + React portal | yes | `dblclick` works |
| demo6 | `webspatial://createOrnament?...` | ornament + React portal | yes | `dblclick` is missing |
| demo7 | `about:blank` | nested child view + z offset | no | `dblclick` works |
| demo8 | `webspatial://createSpatialized2DElement?...` | nested child view + z offset | no | `dblclick` is missing |

## Notes

- Demos 4 and 5 load React UMD bundles from `https://unpkg.com`, so those two require network access.
- The project intentionally does not depend on the WebSpatial SDK runtime target. It isolates the WebKit behavior by reproducing the `window.open` and `WKUIDelegate.createWebViewWith` handoff directly.
