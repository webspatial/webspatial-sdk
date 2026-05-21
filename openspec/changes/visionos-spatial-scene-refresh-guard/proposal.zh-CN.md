# 提案：VisionOS SpatialScene 刷新代际保护

## 背景与动机

VisionOS native 代码拥有独立的 `SpatialScene` 实现，负责 `WKWebView` 生命周期、`Spatialized2DElement` 创建和 scene object registry。页面导航或刷新时，`SpatialScene` 当前会在主页面开始加载时销毁已注册的 spatial objects。但 `webspatial://` window-open 请求仍可能通过 `onOpenWindowHandler` 创建新的 native `Spatialized2DElement` 实例。

VisionOS native 层应显式建模页面生命周期 generation，让 SpatialDiv 创建请求与发起它的页面 generation 关联起来。这可以让 VisionOS 与前端 request metadata 契约保持一致，并防止 stale 创建被挂到错误的 scene generation 上。

## 变更内容

- 为 VisionOS `SpatialScene` 增加 page generation / epoch 状态。
- 主 web view 开始加载时，以及 navigation reset 明确清理 scene objects 时，递增 generation。
- 从 `webspatial://createSpatialized2DElement` 和 `webspatial://createAttachment` open-window URL 中读取 request metadata。
- 对 generation-aware 创建请求，在接受前比较 request epoch 和当前 scene generation。
- 增加 page generation 和 spatial object ids 的 debug / inspect 字段。
- **破坏性变更**：无。初期对 malformed metadata 的处理应保持兼容，除非请求明确 stale。

## 能力定义

### 新增能力

- `visionos-spatial-scene-refresh-guard`：定义 VisionOS native 的页面 generation 跟踪、request metadata 消费、stale SpatialDiv 处理和 inspect 可观测性。

### 修改能力

- 无。

## 影响范围

- `packages/visionOS/web-spatial/model/SpatialScene.swift`
- `packages/visionOS/web-spatial/model/Spatialized2DElement.swift`
- `packages/visionOS/web-spatial/webview/SpatialWebController.swift`
- `packages/visionOS/web-spatial/webview/SpatialWebViewModel.swift`
- `packages/visionOS/web-spatialTests/*`
