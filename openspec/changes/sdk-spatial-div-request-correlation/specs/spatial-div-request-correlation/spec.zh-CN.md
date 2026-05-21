## 新增需求

### 需求：SpatialDiv 创建请求携带刷新安全 metadata

SDK 在打开 `createSpatialized2DElement` 和 `createAttachment` 平台协议 URL 时，必须携带刷新安全的 request metadata。

metadata 必须包括：

- `wsrid`：由前端 SDK 生成的不透明 request id。
- `wsepoch`：当宿主 runtime 向 SDK 暴露页面生命周期 epoch 时携带。

#### 场景：SpatialDiv 创建 URL 包含 request id

- **当** SDK 打开 `webspatial://createSpatialized2DElement` 协议 URL
- **则** URL 必须包含非空 `wsrid` query 参数

#### 场景：Attachment 创建 URL 包含 request id

- **当** SDK 打开 `webspatial://createAttachment` 协议 URL
- **则** URL 必须包含非空 `wsrid` query 参数

#### 场景：宿主页 epoch 可用

- **给定** 宿主 runtime 向 SDK 暴露当前页面 epoch
- **当** SDK 打开 SpatialDiv 或 attachment 创建协议 URL
- **则** URL 必须包含值为该 epoch 的 `wsepoch`

#### 场景：宿主页 epoch 不可用

- **给定** SDK 无法获取宿主页 epoch
- **当** SDK 打开 SpatialDiv 或 attachment 创建协议 URL
- **则** URL 仍必须包含有效 `wsrid`

### 需求：Request id 不透明且刷新安全

`wsrid` 必须被宿主平台视为不透明关联 key。SDK 可以使用内部 nonce 和序号生成它，但消费者不得依赖其内部格式。

#### 场景：新的 JavaScript context 创建 request id

- **当** 页面刷新后 SDK request id 生成逻辑重新初始化
- **则** 新生成的 `wsrid` 在实际使用中不得与上一 JavaScript context 生成的值冲突

### 需求：Pending creation callback 被清理

SDK 必须在 SpatialDiv 和 attachment 创建请求成功完成或超时后，移除 pending request receiver。

#### 场景：Native 创建 callback 成功

- **当** 收到某个 `wsrid` 对应的 native 创建 callback
- **则** SDK 必须移除该请求的 pending receiver

#### 场景：Native 创建 callback 未到达

- **当** 配置的超时时间内未收到 native 创建 callback
- **则** SDK 必须移除该请求的 pending receiver
- **并且** 创建 promise 必须以失败结果或等价错误路径 settle
