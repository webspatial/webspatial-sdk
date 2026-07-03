## 1. Symbol Audit

- [ ] 1.1 Audit all references to `xrCurrentSceneDefaults`, `xrCurrentSceneType`, and related scene hook globals across packages, apps, tests, native sources, and generated public declarations.
- [ ] 1.2 Confirm every reference is either part of the removal work or intentionally preserved in proposal/spec/migration text.

## 2. Failing Tests First

- [ ] 2.1 Add or update Core SDK tests that fail while `window.xrCurrentSceneType` remains declared or installed by the scene polyfill.
- [ ] 2.2 Add or update Core SDK tests proving `window.open(url, target)` without matching `initScene(target, ...)` still resolves the window scene fallback config.
- [ ] 2.3 Add or update manifest/default tests proving manifest-derived scene defaults still apply to `window.open` without `initScene()`.
- [ ] 2.4 Add or update React SDK public-surface/type tests proving the removed globals are no longer exposed as supported window members.
- [ ] 2.5 Add the smallest available visionOS regression check proving pending scene opening does not depend on the removed globals and does not remain stuck in pending state.
- [ ] 2.6 Run the targeted tests and confirm they fail for the intended missing behavior before implementation.

## 3. SDK Implementation

- [ ] 3.1 Remove the deleted scene globals from Core SDK global TypeScript declarations.
- [ ] 3.2 Remove Core SDK scene polyfill reads or writes of the deleted globals.
- [ ] 3.3 Route no-`initScene()` `window.open` scene creation through the existing scene default-resolution path without introducing new JS-side default values.
- [ ] 3.4 Preserve existing `initScene()` callback behavior, callback chaining, and scene-type default precedence.
- [ ] 3.5 Remove opened-page runtime override support from `window.xrCurrentSceneDefaults(pre)`; use opener-side `initScene(target, ...)`, manifest defaults, or fallback defaults for supported configuration coverage.
- [ ] 3.6 Remove or update demos/tests that manually assign deleted globals, using `initScene()` or manifest defaults for supported scene configuration coverage.

## 4. VisionOS Native Implementation

- [ ] 4.1 Audit `packages/visionOS/web-spatial/model/SpatialScene.swift` for the `didFinishLoad -> checkHookExist()` flow and any nearby bridge state that only supports the deleted globals.
- [ ] 4.2 Remove the `checkHookExist` global existence check from the visionOS pending-scene visibility flow.
- [ ] 4.3 Ensure removing `checkHookExist` still advances pending scenes to visibility using open-time config or the existing native fallback path, so a page without deleted globals cannot remain stuck pending.
- [ ] 4.4 Preserve supported visionOS `SpatialScene` lifecycle behavior unrelated to the removed globals.

## 5. Verification

- [ ] 5.1 Run targeted Core SDK scene polyfill and manifest scene tests.
- [ ] 5.2 Run React SDK public surface and stateless utility tests that cover `initScene()`.
- [ ] 5.3 Run available visionOS checks for the touched pending-scene path.
- [ ] 5.4 Run a final repo-wide search to ensure removed globals no longer appear in public declarations, runtime polyfill logic, demos, or tests except in migration/spec text.
