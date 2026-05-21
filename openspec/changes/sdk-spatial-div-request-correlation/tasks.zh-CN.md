# 任务：sdk-spatial-div-request-correlation

## 1. Request metadata 契约

- 1.1 定义内部 helper，用于创建刷新安全的不透明 `wsrid`。
- 1.2 定义内部 helper，用于读取宿主注入的当前页面 epoch。
- 1.3 文档化 `wsrid` 为不透明请求身份，`wsepoch` 为页面归属 metadata。

## 2. 平台适配层

- 2.1 更新 PicoOS SpatialDiv 创建协议 URL，加入 `wsrid` 和 `wsepoch`。
- 2.2 更新 PicoOS attachment 创建协议 URL，加入 `wsrid` 和 `wsepoch`。
- 2.3 迁移期保留 legacy `rid` callback key 兼容。
- 2.4 更新 VisionOS 前端协议 URL 构造，携带同样的 metadata 字段。

## 3. Pending receiver 清理

- 3.1 为 pending creation request receiver 增加超时清理。
- 3.2 确保超时只移除 receiver 一次。
- 3.3 确保 native callback 成功后清理 timeout 并移除 receiver。

## 4. 测试

- 4.1 增加测试，验证模拟页面刷新 / 模块重新初始化后 `wsrid` 不冲突。
- 4.2 增加测试，验证 epoch 可用时发出的协议 URL 包含 `wsrid` 和 `wsepoch`。
- 4.3 增加测试，验证缺失 epoch 时仍发出有效 `wsrid`。
- 4.4 增加 pending receiver 超时清理测试。

## 5. 验证

- 5.1 运行 `packages/core` 定向单元测试。
- 5.2 如可用，运行 `@webspatial/core-sdk` 包的 typecheck/build。
