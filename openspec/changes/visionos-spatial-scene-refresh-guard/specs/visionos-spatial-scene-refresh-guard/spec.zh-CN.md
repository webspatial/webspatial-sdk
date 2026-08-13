## 新增需求

### 需求：VisionOS SpatialScene 跟踪当前页面 generation

VisionOS `SpatialScene` 必须维护一个用于刷新边界判断的权威当前页面 generation。

#### 场景：主页面开始加载

- **当** 主页面开始新的加载周期
- **则** `SpatialScene` 必须在清理 scene 内容之前先递增当前页面 generation

### 需求：VisionOS 通过 wsepoch 拒绝 stale 请求

当字段存在时，VisionOS 的请求处理必须使用 `wsepoch` 作为 freshness 裁决字段。

#### 场景：请求 epoch 与当前 generation 匹配

- **给定** 一个 SpatialDiv 或 attachment 请求携带 `wsepoch=G2`
- **并且** `SpatialScene.currentPageGeneration` 为 `G2`
- **当** VisionOS 处理该请求
- **则** 该请求可以被接受

#### 场景：请求 epoch 已过期

- **给定** 一个 SpatialDiv 或 attachment 请求携带 `wsepoch=G1`
- **并且** `SpatialScene.currentPageGeneration` 为 `G2`
- **当** VisionOS 处理该请求
- **则** VisionOS 必须将该请求判定为 stale 并拒绝
- **并且** 不得将对应内容挂载到当前 scene

#### 场景：compatibility mode 下请求没有 wsepoch

- **给定** 一个 SpatialDiv 或 attachment 请求未携带 `wsepoch`
- **当** VisionOS 在 compatibility mode 下处理该请求
- **则** VisionOS 必须记录兼容性 warning
- **并且** 可以接受该请求

### 需求：VisionOS 仅将 rid 用于关联与诊断

VisionOS 必须将 `rid` 视为请求关联字段，不得将其用于 freshness 裁决。

#### 场景：记录请求日志

- **当** VisionOS 记录请求接受或拒绝日志
- **则** 日志应包含请求 `rid`
- **并且** 可以附带 `wsepoch` 以便 freshness 诊断

### 需求：inspect 暴露刷新诊断信息

VisionOS 的 inspect 输出必须暴露 generation 与对象标识诊断信息，以便分析刷新问题。

#### 场景：刷新后 inspect 当前 scene

- **当** 在页面刷新后 inspect 当前 scene
- **则** 输出必须包含当前页面 generation
- **并且** 必须包含足以诊断 retained content 的 scene 对象 id 或 child id
