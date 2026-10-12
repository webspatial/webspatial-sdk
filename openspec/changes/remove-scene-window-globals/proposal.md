## Why

`window.xrCurrentSceneDefaults` and `window.xrCurrentSceneType` are undocumented scene globals that duplicate internal scene state and make `window.open` behavior appear coupled to `initScene()`. Removing them keeps the public surface smaller while preserving the supported scene fallback path for pages that call `window.open` without first calling `initScene()`.

## What Changes

- Hard-delete the undocumented `window.xrCurrentSceneDefaults` and `window.xrCurrentSceneType` APIs from SDK type declarations, JavaScript runtime polyfills, and native scene state plumbing.
- Preserve `initScene()` as the supported way to customize scene configuration.
- Ensure `window.open` can open without a prior `initScene()` call by using the existing scene API fallback defaults defined by manifest configuration and native fallback behavior.
- Remove the visionOS native `checkHookExist` path that only exists to wait for or detect the deleted scene globals.
- Remove the undocumented opened-page runtime override path provided by `window.xrCurrentSceneDefaults(pre)`.
- Keep fallback default ownership in the existing manifest/native fallback layers; this change does not introduce a new JavaScript-side default configuration model.

## Capabilities

### New Capabilities
- `scene-window-api`: Define the supported scene behavior for `window.open`, `initScene()`, and the absence of undocumented scene globals. This is new because the current OpenSpec baseline does not contain an archived scene API capability to modify; related manifest-scene work is an active change, not a baseline spec.

### Modified Capabilities

## Impact

- Affects React SDK public/global API typings that currently expose the scene globals.
- Affects Core SDK scene polyfill logic that currently installs or reads the scene globals.
- Affects the visionOS native pending-scene visibility path that currently checks for `window.xrCurrentSceneDefaults`.
- Affects tests that assert scene global availability or `window.open` dependency on prior `initScene()` setup.
