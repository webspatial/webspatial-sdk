# 任务：visionos-spatial-scene-refresh-guard

## 1. Page generation 状态

- 1.1 在 VisionOS `SpatialScene` 中增加 `currentPageGeneration`。
- 1.2 在 `.didStartLoad` 销毁 spatial objects 前递增 generation。
- 1.3 确保 `resetForNavigation()` 使用同样的 generation 边界语义。

## 2. Request metadata 解析

- 2.1 增加 helper，用于从 `webspatial` URL 解析 `wsrid` 和 `wsepoch`。
- 2.2 在 SpatialDiv 创建的 `onOpenWindowHandler` 中应用解析。
- 2.3 在 metadata 存在时，对 attachment 创建应用解析。

## 3. Stale request 处理

- 3.1 如果 `wsepoch` 存在且与当前 generation 不匹配，不将 SpatialDiv 内容挂到当前 scene。
- 3.2 增加 accepted、stale、malformed metadata 路径的 debug 日志。
- 3.3 对缺失 metadata 保持 warn-and-accept 兼容模式。

## 4. Inspect 与诊断

- 4.1 在 inspect 输出中增加 `currentPageGeneration`。
- 4.2 增加或细化 children/object id 字段，用于刷新问题调试。
- 4.3 确保 inspect 能区分 children 和全局 object registry 内容。

## 5. 验证

- 5.1 为 metadata 解析 helper 增加测试。
- 5.2 增加刷新清理后 SpatialDiv 创建的测试或手动验证。
- 5.3 运行可用的 VisionOS package tests。
