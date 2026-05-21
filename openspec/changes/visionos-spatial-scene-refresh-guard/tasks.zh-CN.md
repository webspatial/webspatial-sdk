# 任务：VisionOS SpatialScene 刷新保护

- [x] 在 VisionOS `SpatialScene` 中增加当前页面 generation 跟踪，并在刷新 cleanup 前递增。
- [x] 从 SpatialDiv 与 attachment 请求中解析 `rid` 与可选的 `wsepoch`。
- [x] 仅在 `wsepoch` 存在且与当前页面 generation 不匹配时拒绝 stale 请求。
- [x] 对未携带 `wsepoch` 的请求保持 compatibility mode，并记录 warning 日志。
- [x] 增强 inspect 与日志，补充 generation、请求标识与 scene 对象诊断。
