## ADDED Requirements

### Requirement: Undocumented scene globals are absent from the supported API
SDK 不得将 `window.xrCurrentSceneDefaults` 或 `window.xrCurrentSceneType` 暴露为受支持的运行时 globals，也不得将它们声明为 public TypeScript window 成员。

#### Scenario: Type surface excludes scene globals
- **WHEN** 应用消费 SDK public TypeScript declarations
- **THEN** SDK 不得声明 `window.xrCurrentSceneDefaults`
- **AND** SDK 不得声明 `window.xrCurrentSceneType`

#### Scenario: Runtime polyfill does not install scene globals
- **WHEN** Core SDK scene hook 或 scene polyfill 初始化
- **THEN** 它不得创建 `window.xrCurrentSceneDefaults`
- **AND** 它不得创建 `window.xrCurrentSceneType`

### Requirement: Window open uses fallback scene defaults without initScene
未注册匹配的 `initScene()` callback 时，SDK 必须允许 `window.open` 创建 spatial scene。解析出的 creation config 必须来自现有 scene 默认配置解析路径，包括适用的 manifest-derived defaults 和 native fallback 行为。

#### Scenario: Named window open without initScene
- **WHEN** 应用调用 `window.open(url, target)`，且 `target` 不是特殊 target
- **AND** 未注册 `initScene(target, ...)` callback
- **THEN** SDK 必须使用现有 window scene 默认配置请求创建 spatial scene
- **AND** SDK 不得要求存在 `window.xrCurrentSceneDefaults`
- **AND** SDK 不得要求存在 `window.xrCurrentSceneType`

#### Scenario: Manifest defaults still apply without initScene
- **WHEN** manifest 提供 scene API 支持的 scene defaults
- **AND** 应用未注册 `initScene(target, ...)` 就调用 `window.open(url, target)`
- **THEN** SDK 必须在 scene creation request 中包含适用的 manifest-derived defaults，并由 native defaults 兜底未指定的值

### Requirement: InitScene remains the supported customization API
SDK 必须保留 `initScene()`，作为注册 named scene configuration callback 的受支持 API。

#### Scenario: Named window open with initScene
- **WHEN** 应用注册 `initScene(target, callback, options)`
- **AND** 随后用相同 target 调用 `window.open(url, target)`
- **THEN** SDK 必须根据现有 `initScene()` 优先级规则使用该 target 的注册 scene configuration
- **AND** 行为不得依赖 `window.xrCurrentSceneDefaults`
- **AND** 行为不得依赖 `window.xrCurrentSceneType`

### Requirement: Opened-page runtime scene override is removed
SDK 不得继续支持 opened-page 侧通过 `window.xrCurrentSceneDefaults(pre)` 或 `window.xrCurrentSceneType` 进行运行时 scene 配置覆盖。Scene 配置必须来自发起侧 `initScene(target, ...)`、manifest-derived defaults、open-time config 或 native fallback 行为。

#### Scenario: Opened page defines removed globals
- **WHEN** 被打开页面定义 `window.xrCurrentSceneDefaults`
- **OR** 被打开页面定义 `window.xrCurrentSceneType`
- **THEN** SDK 不得使用这些 globals 覆盖 pending scene creation config
- **AND** 受支持 scene 配置必须继续来自发起侧 `initScene(target, ...)`、manifest defaults、open-time config 或 native fallback 行为

### Requirement: VisionOS pending scene opening does not depend on removed globals
VisionOS native 代码不得要求被删除的 scene globals 存在，才能决定 pending spatial scene 是否可以变为可见，或是否可以获得兜底 creation config。

#### Scenario: Pending scene page does not define removed globals
- **WHEN** visionOS 打开一个 pending spatial scene 页面
- **AND** 页面未定义 `window.xrCurrentSceneDefaults`
- **AND** 页面未定义 `window.xrCurrentSceneType`
- **THEN** visionOS scene opening 必须继续使用 open-time config 或受支持的 native fallback scene config 路径
- **AND** scene 不得仅因为这些 globals 缺失而卡在 pending 状态
