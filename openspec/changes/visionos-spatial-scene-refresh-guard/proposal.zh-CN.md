# 提案：VisionOS SpatialScene 刷新保护

## 为什么

VisionOS native `SpatialScene` 可能在页面刷新 cleanup 边界之后，仍然收到 SpatialDiv 与 attachment 创建请求。如果没有页面代际检查，stale 请求就可能把不属于当前页面的内容挂载到当前 scene 上。

VisionOS 应将 `wsepoch` 作为 freshness 的唯一裁决字段，同时仅将 `rid` 用于关联与诊断。

## 变更内容

- 在 VisionOS `SpatialScene` 内维护 `currentPageGeneration`。
- 在刷新 cleanup 前先递增页面 generation。
- 从 SpatialDiv 与 attachment 请求中解析 `rid` 与可选的 `wsepoch`。
- 当 `wsepoch` 存在且与当前页面 generation 不匹配时拒绝 stale 请求。
- 对不携带 `wsepoch` 的请求保持 compatibility mode。
- 增强 inspect 与日志中的 generation 和对象标识诊断。

## 边界

- 本 change 覆盖 VisionOS native scene 生命周期与请求 freshness 判断。
- `rid` 仅用于请求关联与诊断。
- `wsepoch` 是 freshness 的唯一裁决字段。

## 能力

### 新增能力

- `visionos-spatial-scene-refresh-guard`：规定 VisionOS SpatialDiv 处理中的页面代际跟踪与 stale 请求拒收。

### 修改能力

- 无。

## 影响范围

- `packages/visionOS/web-spatial/model/SpatialScene.swift`
- 相关 VisionOS inspect / 日志路径
