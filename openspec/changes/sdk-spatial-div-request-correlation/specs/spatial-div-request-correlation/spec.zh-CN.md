## 新增需求

### 需求：SDK 发出刷新安全的请求关联 id

前端 SDK 在创建每一个 SpatialDiv 与 attachment 请求时，都必须发出非空的 `rid`。

#### 场景：创建 SpatialDiv 请求

- **当** SDK 构造 SpatialDiv 请求 URL
- **则** URL 必须包含非空的 `rid` query 参数

#### 场景：创建 attachment 请求

- **当** SDK 构造 attachment 请求 URL
- **则** URL 必须包含非空的 `rid` query 参数

#### 场景：页面刷新后创建新的 JavaScript context

- **当** SDK 在页面刷新或模块重新初始化后继续生成 `rid`
- **则** 新生成的 `rid` 在实际使用中不得与上一 JavaScript context 生成的值发生碰撞

### 需求：SDK 在可用时发出页面归属 metadata

当前端可以读取宿主提供的页面 epoch metadata 时，SDK 必须发出 `wsepoch`。

#### 场景：宿主提供页面 epoch

- **给定** 宿主向 SDK 暴露了页面 epoch metadata
- **当** SDK 创建 SpatialDiv 或 attachment 请求
- **则** URL 必须包含值为该 epoch 的 `wsepoch`

#### 场景：宿主未提供页面 epoch

- **给定** 宿主没有向 SDK 暴露页面 epoch metadata
- **当** SDK 创建 SpatialDiv 或 attachment 请求
- **则** URL 可以省略 `wsepoch`
- **并且** 仍然必须包含有效的 `rid`

### 需求：SDK 继续通过 rid 做回调关联

前端的完成回调处理必须继续通过 `rid` 关联 SpatialDiv 创建请求。

#### 场景：收到 native 创建回调

- **当** 收到某个请求 `rid` 对应的 native 创建回调
- **则** SDK 必须使用该 `rid` 解析或拒绝对应的 pending request

#### 场景：宿主链路未消费 wsepoch

- **给定** 宿主链路尚未消费 `wsepoch`
- **当** 请求仍然通过 `rid` 完成
- **则** SDK 必须保持兼容
- **并且** stale 请求拒收是否生效取决于宿主对 `wsepoch` 的支持
