# Custom scheme `window.open("webspatial://...")` breaks `dblclick` synthesis in child `WKWebView`

## Summary

In a visionOS SwiftUI host that embeds `WKWebView`, a child `WKWebView` created by `window.open("webspatial://...")` and returned from `WKUIDelegate.webView(_:createWebViewWith:for:windowFeatures:)` does not reliably synthesize DOM `dblclick` events. React `onDoubleClick` is also missing in the same child document.

The same native child `WKWebView` creation, injection, and display path works when the initial child URL is a standard URL such as `about:blank`.

## Expected behavior

When a user double clicks or double taps a normal DOM button inside the child `WKWebView`, WebKit should emit the standard event sequence:

```text
pointerdown
pointerup
click detail=1
pointerdown
pointerup
click detail=2
dblclick detail=2
```

React synthetic `onDoubleClick` should also fire when the button is rendered through a React portal into that child window.

## Actual behavior

When the child window is opened with `window.open("webspatial://...")`:

- DOM `dblclick` is missing inside the child document.
- React `onDoubleClick` is missing when using a cross-window React portal.
- The same host path receives basic pointer/click input, but the second-click synthesis chain differs from the `about:blank` control.

When the child window is opened with `window.open("about:blank")`, the child document can synthesize `click detail=2` and `dblclick detail=2`.

## Reproduction project

This branch includes a standalone visionOS repro project:

```text
apps/double-click-probe-visionos/DoubleClickProbe.xcodeproj
```

Run it on an Apple Vision Pro simulator, select a demo from the sidebar, double click the root and child probe buttons, and inspect Xcode console logs prefixed with `[DoubleClickProbe]`.

## Demo matrix

| Demo | `window.open` URL | Host shape | React | Observed / expected |
| --- | --- | --- | --- | --- |
| demo0 | no `window.open` | direct root + SwiftUI ornament | no | `dblclick` works |
| demo1 | `about:blank` | `createWebViewWith` + ornament | no | `dblclick` works |
| demo2 | `about:blank` | ornament + WebSpatial-like body style | no | `dblclick` works |
| demo3 | `webspatial://createOrnament?...` | ornament + WebSpatial-like body style | no | local confirmation pending; expected to miss `dblclick` |
| demo4 | `about:blank` | ornament + head/style/class sync | no | `dblclick` works |
| demo5 | `about:blank` | ornament + React portal | yes | `dblclick` works |
| demo6 | `webspatial://createOrnament?...` | ornament + React portal | yes | `dblclick` is missing |
| demo7 | `about:blank` | nested child view + z offset | no | `dblclick` works |
| demo8 | `webspatial://createSpatialized2DElement?...` | nested child view + z offset | no | `dblclick` is missing |

## Why this points to the initial URL scheme

The control demos rule out the following variables:

- `WKWebView` itself lacking `dblclick` support.
- SwiftUI `.ornament`.
- `window.open` and `createWebViewWith` by themselves.
- WebSpatial-like viewport or body styles.
- head/style/link/className sync.
- React portal synthetic event handling.
- plain nested SwiftUI child view layout.
- z offset / depth placement.

The remaining distinguishing variable is the initial URL passed to `window.open`. The `about:blank` path works, while the `webspatial://...` path breaks child-window double-click synthesis.

## Possible fix direction

Avoid using `webspatial://...` as the real initial URL for the child browsing context.

Keep the existing synchronous `window.open` creation model, but move the spatial command data from the custom scheme/host into the query string of a standard URL:

```text
window.open("about:blank?command=createOrnament&attachmentAnchor=bottom&...", target, features)
```

In other words, avoid putting the command in the URL scheme or host:

```text
webspatial://createOrnament?...
```

Instead, parameterize the same data on `about:blank`:

```text
about:blank?command=createOrnament&attachmentAnchor=bottom&contentAlignment=back&visibility=visible&width=360&height=240
```

One possible flow:

1. JavaScript synchronously calls `window.open("about:blank?<encoded-webspatial-params>", target, features)`.
2. Native reads `navigationAction.request.url` in `createWebViewWith`.
3. Native parses `command` and spatial element parameters from the URL query.
4. Native creates the corresponding spatial container and returns the child `WKWebView`.
5. The child document continues to be written by the SDK or rendered through React Portal.

This preserves the original synchronous `window.open` creation model while avoiding a custom-scheme URL that can affect WebKit child-window event synthesis.
