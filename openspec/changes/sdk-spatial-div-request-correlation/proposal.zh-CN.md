# 提案：SDK SpatialDiv 请求关联

## 为什么

SpatialDiv 与 attachment 创建需要两个相互独立的信号：

- `rid`：用于异步完成回调与日志关联的请求标识。
- `wsepoch`：用于宿主 runtime 执行 freshness 判断的页面归属 metadata。

本轮协议继续以 `rid` 作为唯一的请求关联字段，同时将其生成值升级为在实际使用中对刷新安全且 opaque 的形式。这样既能保持现有宿主集成的兼容性，也能让已升级的宿主在拿到 `wsepoch` 时启用 stale 请求拒收。

## 变更内容

- 为 SpatialDiv 与 attachment 请求生成刷新安全的 opaque `rid`。
- 当宿主向 SDK 暴露页面 epoch 信息时，发出 `wsepoch`。
- 继续以 `rid` 作为请求完成回调的关联 key。
- 更新前端平台适配层，统一发出 `rid` 与可选的 `wsepoch`。
- 增加针对 `rid` 刷新安全性与请求 metadata 发出的测试。

## 边界

- 本 change 仅覆盖前端 SDK 的请求构造与回调关联。
- 本 change 不定义 native 侧的 stale 拒收行为；宿主 runtime 决定如何消费 `wsepoch`。
- 本 change 不引入新的请求关联字段名。

## 能力

### 新增能力

- `spatial-div-request-correlation`：规定前端创建 SpatialDiv 请求时，使用刷新安全的 `rid` 与可选的 `wsepoch`。

### 修改能力

- 无。

## 影响范围

- `packages/core/src/platform-adapter/*`
- `packages/core/src/scene-polyfill.ts`
- `packages/core/src/types/global.ts`
- 前端请求 / 回调测试
