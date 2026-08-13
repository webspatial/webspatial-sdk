# 任务：SDK SpatialDiv 请求关联

- [x] 定义内部 helper，为 SpatialDiv 与 attachment 请求生成刷新安全的 opaque `rid`。
- [x] 更新前端请求构造路径，统一发出 `rid` 与可选的 `wsepoch`。
- [x] 保持回调关联、超时清理与 pending request 管理继续基于 `rid`。
- [x] 确保 scene polyfill 与相关转发链路原样保留 `rid` 与可选的 `wsepoch`。
- [x] 增加聚焦测试，覆盖 `rid` 的刷新安全性、请求 URL 发出以及回调关联行为。
