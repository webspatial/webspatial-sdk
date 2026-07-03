## 背景

`window.xrCurrentSceneDefaults` 和 `window.xrCurrentSceneType` 是未公开文档化的 scene 全局 API，它们重复暴露了内部 scene 状态，也让 `window.open` 的行为看起来依赖 `initScene()`。删除这两个全局 API 可以收窄公开表面积，同时保留未调用 `initScene()` 时通过 scene 兜底配置打开窗口的受支持路径。

## 变更内容

- 从 SDK 类型声明、JavaScript 运行时 polyfill、native scene 状态链路中硬删除未公开文档化的 `window.xrCurrentSceneDefaults` 和 `window.xrCurrentSceneType` API。
- 保留 `initScene()`，继续作为自定义 scene 配置的受支持入口。
- 确保未提前调用 `initScene()` 时，`window.open` 仍可通过现有 scene API 的兜底默认配置打开；默认来源由 manifest 配置和 native fallback 行为定义。
- 删除 visionOS native 中仅用于等待或检测这两个 scene globals 的 `checkHookExist` 路径。
- 删除未公开文档化的 opened-page runtime override 路径，即 `window.xrCurrentSceneDefaults(pre)`。
- 兜底默认配置继续由现有 manifest/native fallback 层负责；本变更不在 JavaScript 侧新增一套默认配置模型。

## Capabilities

### New Capabilities
- `scene-window-api`：定义 `window.open`、`initScene()` 以及未文档化 scene globals 不存在时的受支持 scene 行为。它是 new capability，因为当前 OpenSpec 基线没有已归档的 scene API capability 可修改；相关的 manifest scene 能力仍是另一个 active change，不属于基线 spec。

### Modified Capabilities

## 影响范围

- 影响当前暴露 scene globals 的 React SDK public/global API 类型。
- 影响当前安装或读取 scene globals 的 Core SDK scene polyfill 逻辑。
- 影响 visionOS native 中当前检查 `window.xrCurrentSceneDefaults` 的 pending-scene visibility 路径。
- 影响断言 scene globals 存在，或断言 `window.open` 依赖预先调用 `initScene()` 的测试。
