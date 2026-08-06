---
'@webspatial/core-sdk': patch
'@webspatial/platform-visionos': patch
---

Remove the undocumented, non-public `window.xrCurrentSceneDefaults` and `window.xrCurrentSceneType` scene globals.

- Drop the global type declarations that these internal APIs added to `Window`.
- Remove the Core SDK scene-polyfill path that read these globals. `window.open` still resolves scene defaults from the manifest / native fallback layers, and `initScene()` remains the supported way to customize scene configuration.
- Remove the visionOS native `checkHookExist` path so a pending scene moves to `.willVisible` directly instead of waiting on the deleted globals.
