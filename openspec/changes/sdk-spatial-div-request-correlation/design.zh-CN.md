# 设计：刷新安全的前端请求关联

## 上下文

从前端视角看，SpatialDiv 创建是异步过程。前端打开一个平台协议 URL，之后收到与 request id 关联的创建结果。递增 request id 在单个 JavaScript 执行上下文内足够，但跨页面刷新边界时较弱。

SDK 应该让请求身份在实际使用中具备全局唯一性，同时不把生成细节暴露给宿主平台。页面生命周期归属应通过单独的 epoch 字段表达。

## 目标 / 非目标

**目标：**

- 生成不透明的 `wsrid`，在实际使用中跨页面刷新不冲突。
- 当宿主 runtime 向 JavaScript 暴露 page lifecycle epoch 时，携带 `wsepoch`。
- 将 `wsrid` 和 `wsepoch` 明确区分：请求身份 vs 页面归属。
- 为 pending request receiver 增加超时清理。
- 在迁移期保持现有协议处理兼容。

**非目标：**

- 本变更不定义宿主 runtime 如何拒绝 stale native 对象。
- 本变更不修改公开的 `SpatialSession` 或 React API。
- 本变更不让前端 unmount cleanup 成为页面刷新时的权威清理机制。

## 决策

### 决策 1：使用两个协议字段

`wsrid` 是不透明 request id。它必须由前端 SDK 生成，并且不得要求宿主平台解析其内部结构。

`wsepoch` 是可比较的页面生命周期值。它可以由宿主 runtime 注入到 `window.__webspatialsdk__.pageEpoch` 或等价的 SDK 可读字段中。如果不存在，SDK 仍然发出 `wsrid`，并省略或留空 `wsepoch`。

协议示例：

```text
webspatial://createSpatialized2DElement?wsrid=wsreq_k8f3a2_12&wsepoch=7
webspatial://createAttachment?wsrid=wsreq_k8f3a2_13&wsepoch=7
```

### 决策 2：`wsrid` 保持不透明且刷新安全

SDK 可以用“每个 JS context 一个随机 nonce + 递增序号”来构造 `wsrid`。最终结果是单个不透明协议字段。宿主平台只把它当作关联 key 使用。

### 决策 3：保留现有 callback id 路径兼容

迁移期内，平台适配层可以同时发出 legacy `rid` 参数，或让 `rid` 等于 `wsrid`，以便旧 native host 仍然可以解析 pending 请求。

首选 callback key 是 `wsrid`。只有在所有支持的宿主都消费新字段后，才应移除 legacy `rid` 路径。

### 决策 4：增加 pending receiver 超时清理

为协议创建注册的 pending request receiver 必须在有界超时后移除。超时时应通过结构化失败结果或等价错误路径让请求 settle，而不是无限持有 callback。

### 决策 5：React cleanup 契约保持不变

React unmount cleanup 仍然是 best-effort，并继续对已创建的 spatial element 调用 `destroy()`。页面刷新清理仍是宿主生命周期职责，不由此前端变更变成权威机制。

## 风险 / 折衷

- **[风险] 宿主尚未消费 `wsepoch`**：保持旧行为兼容，先通过日志和测试验证 metadata 发出。
- **[风险] 超时时间对慢速宿主创建过短**：选择保守默认值，并允许内部调整而不改变公开 API。
- **[风险] 重复协议参数导致歧义**：文档明确 `wsrid` 为首选，`rid` 仅用于兼容。

## 迁移计划

1. 发出 `wsrid` 和 `wsepoch`，同时保留 legacy `rid` 兼容。
2. 增加测试，模拟模块重载后 request id 不冲突。
3. 增加 pending receiver 超时清理测试。
4. 所有宿主平台消费 `wsrid` 后，在后续变更中移除 legacy-only 假设。

## 开放问题

- native 内容宿主创建的默认超时时间应是多少？
- 超时行为是否需要为自动化测试提供内部可配置能力？
