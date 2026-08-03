# 设计：SDK SpatialDiv 请求关联

## 背景

前端 SDK 在 native 宿主接收到请求之前就负责构造 SpatialDiv 与 attachment 请求。宿主当前已经将 `rid` 作为请求关联值使用，而升级后的宿主还可以额外消费 `wsepoch` 来执行 freshness 判断。

因此，SDK 应继续使用 `rid` 作为请求关联字段，并将其升级为刷新安全的形式；只有在页面 epoch 信息可用时才发出 `wsepoch`。

## 目标 / 非目标

**目标：**

- 本轮继续以 `rid` 作为唯一请求关联字段。
- 让发出的 `rid` 在实际使用中对页面刷新安全且 opaque。
- 当宿主提供页面 epoch 时发出 `wsepoch`。
- 保持前端回调关联仍然基于 `rid`。
- 对尚未消费 `wsepoch` 的宿主保持兼容。

**非目标：**

- 本 change 不负责 native 侧 stale 拒收决策。
- 本 change 不要求宿主解析 `rid` 的内部结构。
- 本 change 不新增第二个请求关联字段。

## 决策

### 决策 1：`rid` 继续作为请求关联字段

SDK 必须继续为 SpatialDiv 与 attachment 请求发出 `rid`。在本轮 rollout 中，`rid` 是唯一的请求关联字段。

### 决策 2：`rid` 升级为刷新安全且 opaque

SDK 可以使用“每个 JavaScript context 一个 nonce + 递增序号”或等价策略来生成 `rid`，以避免在实际使用中跨页面刷新发生碰撞。

宿主必须将 `rid` 视为 opaque 字符串，不得依赖其内部结构。

### 决策 3：`wsepoch` 是可选的页面归属 metadata

如果宿主向 JavaScript 暴露了页面 epoch 信息，SDK 必须发出对应的 `wsepoch`。

如果页面 epoch 信息不可用，SDK 必须省略 `wsepoch`，但仍然发出有效的 `rid`。

### 决策 4：回调关联继续使用 `rid`

前端的完成回调与超时处理必须继续以 `rid` 作为关联 key。

这样可以保持对仅通过 `rid` 完成请求的宿主路径的兼容性。

### 决策 5：请求 URL 统一携带 `rid` 与可选 `wsepoch`

SDK 发出的请求 URL 形态如下：

```text
webspatial://createSpatialized2DElement?rid=<opaque-rid>&wsepoch=<epoch>
webspatial://createAttachment?rid=<opaque-rid>&wsepoch=<epoch>
```

当页面 epoch 不可用时，可以不发出 `wsepoch` 查询参数。

## 兼容性

- 尚未消费 `wsepoch` 的宿主仍然保持兼容，因为请求完成仍然通过 `rid` 关联。
- 只有宿主链路端到端保留并消费 `wsepoch` 时，才能完整启用 stale 请求拒收。
- 仅升级 SDK 可以保持兼容，但不能保证旧宿主链路具备 stale 请求拒收能力。

## 风险 / 取舍

- **[风险] 宿主对 `rid` 格式存在隐藏假设** -> 保持 `rid` 仍为字符串字段，并通过定向测试验证。
- **[风险] 宿主链路丢失 `wsepoch`** -> 继续通过 `rid` 完成请求以保持兼容。
- **[风险] `rid` 语义过载** -> 明确 `rid` 只用于关联，`wsepoch` 只用于页面归属。

## 验证

- 增加测试，验证生成的 `rid` 在模拟页面刷新 / 模块重建后不发生实际碰撞。
- 增加测试，验证页面 epoch 可用时发出的 URL 包含 `rid` 与 `wsepoch`。
- 增加测试，验证页面 epoch 缺失时仍发出有效 `rid`，并保持回调关联能力。
