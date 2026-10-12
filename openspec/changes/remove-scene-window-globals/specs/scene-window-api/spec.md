## ADDED Requirements

### Requirement: Undocumented scene globals are absent from the supported API
The SDK MUST NOT expose `window.xrCurrentSceneDefaults` or `window.xrCurrentSceneType` as supported runtime globals or public TypeScript window members.

#### Scenario: Type surface excludes scene globals
- **WHEN** an application consumes the SDK public TypeScript declarations
- **THEN** `window.xrCurrentSceneDefaults` MUST NOT be declared by the SDK
- **AND** `window.xrCurrentSceneType` MUST NOT be declared by the SDK

#### Scenario: Runtime polyfill does not install scene globals
- **WHEN** the Core SDK scene hook or scene polyfill initializes
- **THEN** it MUST NOT create `window.xrCurrentSceneDefaults`
- **AND** it MUST NOT create `window.xrCurrentSceneType`

### Requirement: Window open uses fallback scene defaults without initScene
The SDK MUST allow `window.open` to create a spatial scene when no matching `initScene()` callback has been registered. The resolved creation config MUST come from the existing scene default resolution path, including manifest-derived defaults and native fallback behavior where applicable.

#### Scenario: Named window open without initScene
- **WHEN** an application calls `window.open(url, target)` with a non-special `target`
- **AND** no `initScene(target, ...)` callback has been registered
- **THEN** the SDK MUST request spatial scene creation using the existing default scene configuration for a window scene
- **AND** the SDK MUST NOT require `window.xrCurrentSceneDefaults`
- **AND** the SDK MUST NOT require `window.xrCurrentSceneType`

#### Scenario: Manifest defaults still apply without initScene
- **WHEN** a manifest provides scene defaults supported by the scene API
- **AND** an application calls `window.open(url, target)` without registering `initScene(target, ...)`
- **THEN** the SDK MUST include the applicable manifest-derived defaults in the scene creation request before falling back to native defaults for unspecified values

### Requirement: InitScene remains the supported customization API
The SDK MUST preserve `initScene()` as the supported API for registering named scene configuration callbacks.

#### Scenario: Named window open with initScene
- **WHEN** an application registers `initScene(target, callback, options)`
- **AND** later calls `window.open(url, target)` with the same target
- **THEN** the SDK MUST use the registered scene configuration for that target according to the existing `initScene()` precedence rules
- **AND** the behavior MUST NOT depend on `window.xrCurrentSceneDefaults`
- **AND** the behavior MUST NOT depend on `window.xrCurrentSceneType`

### Requirement: Opened-page runtime scene override is removed
The SDK MUST NOT support opened-page runtime scene configuration through `window.xrCurrentSceneDefaults(pre)` or `window.xrCurrentSceneType`. Scene configuration MUST come from opener-side `initScene(target, ...)`, manifest-derived defaults, open-time config, or native fallback behavior.

#### Scenario: Opened page defines removed globals
- **WHEN** an opened page defines `window.xrCurrentSceneDefaults`
- **OR** the opened page defines `window.xrCurrentSceneType`
- **THEN** the SDK MUST NOT use those globals to override pending scene creation config
- **AND** supported scene configuration MUST continue to come from opener-side `initScene(target, ...)`, manifest defaults, open-time config, or native fallback behavior

### Requirement: VisionOS pending scene opening does not depend on removed globals
VisionOS native code MUST NOT require the removed scene globals to decide whether a pending spatial scene can become visible or receive its fallback creation config.

#### Scenario: Pending scene page does not define removed globals
- **WHEN** visionOS opens a pending spatial scene page
- **AND** the page does not define `window.xrCurrentSceneDefaults`
- **AND** the page does not define `window.xrCurrentSceneType`
- **THEN** visionOS scene opening MUST continue by using open-time config or the supported native fallback scene config path
- **AND** the scene MUST NOT remain stuck in pending state solely because those globals are absent
