# 提案：刷新安全的 SpatialDiv 请求关联

## 背景与动机

`createSpatialized2DElement` 和 attachment 创建在 native 内容宿主可用之前，会通过 `webspatial://` 的 window-open 协议发起请求。当前前端平台适配层里的请求关联基本依赖短生命周期的递增 id。页面刷新后，新的 JavaScript 执行上下文可能重新生成相同的递增 id，而刷新前发起的 native 创建结果仍可能在之后完成。

SDK 需要提供一个由前端负责的 request metadata 契约，让每一次 SpatialDiv / attachment 创建请求都具备刷新安全的关联能力，并便于宿主平台进行回调匹配。该契约必须保持在前端 SDK 和平台适配层内部自包含：它只定义需要发出的 metadata，不定义任何具体宿主如何接收或拒绝 stale native 对象。

## 变更内容

- 为 `webspatial://createSpatialized2DElement` 和 `webspatial://createAttachment` 协议 URL 增加刷新安全的 request metadata 契约。
- 引入两个协议字段：
  - `wsrid`：不透明的唯一请求 id，用于异步回调关联。
  - `wsepoch`：页面生命周期 epoch，由宿主 runtime 提供时携带。
- 更新 PicoOS 前端平台适配层的协议 URL，使其携带 `wsrid` 和 `wsepoch`，迁移期保留现有 `rid` 回调兼容。
- 更新 VisionOS 前端平台适配层的协议 URL，使其携带同一套 metadata 契约。
- 为 pending request receiver 增加超时清理，避免未完成的协议请求长期持有 callback。
- **破坏性变更**：无。现有公开 API 保持不变。

## 能力定义

### 新增能力

- `spatial-div-request-correlation`：定义 SpatialDiv 与 attachment 创建协议的 request metadata、请求 id 唯一性、可选 epoch 透传，以及 pending callback 清理。

### 修改能力

- 无。

## 影响范围

- `packages/core/src/platform-adapter/pico-os/PicoOSPlatform.ts`
- `packages/core/src/platform-adapter/vision-os/VisionOSPlatform.ts`
- `packages/core/src/SpatialWebEvent.ts`
- `packages/core/src/scene-polyfill.ts`
- `packages/core/src/SpatializedElementCreator.ts`
- `packages/core` 中相关单元测试
