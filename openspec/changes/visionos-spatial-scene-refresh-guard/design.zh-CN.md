# 设计：VisionOS SpatialScene 刷新代际保护

## 上下文

VisionOS native `SpatialScene` 注册 web view 状态监听，并在 `.didStartLoad` 时销毁 spatial objects。它也处理 `webspatial` open-window 请求，并为 SpatialDiv 内容创建 `Spatialized2DElement` 实例。

与 Android 的壳/runtime 分层不同，VisionOS 在 `WKUIDelegate` open-window 流程中同步处理 `WKWebView` 创建。即便如此，native 层仍应消费同一套前端 request metadata 契约，让 stale request 语义显式且可测试。

## 目标 / 非目标

**目标：**

- 在 VisionOS `SpatialScene` 中跟踪当前页面 generation。
- 在 generation 边界清理已有 spatial objects。
- 消费 SpatialDiv / attachment 协议 URL 中的 `wsepoch`。
- 按兼容策略拒绝或警告明确 stale 的请求。
- 在 inspect 输出中暴露 generation 和 object ids，便于调试。

**非目标：**

- 本变更不定义前端 request id 生成。
- 本变更不影响 Android 壳工程或 runtime 行为。
- 本变更不修改公开 JavaScript API。

## 决策

### 决策 1：`SpatialScene` 拥有当前 generation

`SpatialScene` 必须维护 `currentPageGeneration`。该值在主页面进入 `.didStartLoad` 时递增，并在 `resetForNavigation()` 执行明确导航清理时递增。

### 决策 2：创建处理器消费 request epoch

`onOpenWindowHandler` 必须在 `webspatial://createSpatialized2DElement` 和 `webspatial://createAttachment` URL 存在 `wsepoch` 时解析它。

如果 `wsepoch` 存在且与 `currentPageGeneration` 不匹配，handler 必须将该请求视为 stale，且不得将对应 SpatialDiv 内容挂到当前 scene。

### 决策 3：缺失 metadata 使用兼容模式

迁移期内，缺失 `wsepoch` 应产生 debug 日志并继续接受请求，避免破坏旧前端 bundle。所有支持的 SDK bundle 都发出 `wsepoch` 后，后续变更可拒绝 malformed metadata。

### 决策 4：Inspect 暴露 generation 和 object ids

VisionOS `SpatialScene` inspect 输出必须包含足够字段，用于区分 scene children 和全局 object registry 内容：

- `currentPageGeneration`
- `childrenIds`
- `spatialObjectList`
- `spatialObjectCount`

### 决策 5：Attachment 处理遵循同一 epoch 边界

Attachment 创建 web view 使用同一类协议，应在存在 request metadata 时具备 generation 感知。Attachment metadata 初始化仍通过现有 JSB 路径完成。

## 风险 / 折衷

- **[风险] WKWebView open-window 流程是同步的**：generation guard 初期可能很少真正 drop 请求，但它能固化生命周期边界。
- **[风险] rollout 期间缺失 epoch**：先采用 warn-and-accept 兼容模式。
- **[风险] Inspect 输出变多**：当前 inspect 已包含 debug-only object list，因此增加 debug 字段可接受。

## 验证

- 尽可能为 URL metadata 解析增加单元或集成覆盖。
- 增加刷新后 SpatialDiv 创建的测试或手动场景。
- 校验 navigation reset 前后的 inspect 输出。
