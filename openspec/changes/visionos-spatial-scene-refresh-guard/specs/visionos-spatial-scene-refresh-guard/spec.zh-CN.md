## 新增需求

### 需求：VisionOS SpatialScene 跟踪页面 generation

VisionOS `SpatialScene` 必须维护当前页面 generation，并在主页面生命周期进入新的导航或刷新边界时推进该值。

#### 场景：主页面开始加载

- **当** 主 `WKWebView` 上报页面开始加载
- **则** `SpatialScene` 必须在接受新的 generation-aware SpatialDiv 创建请求前，推进当前页面 generation

#### 场景：请求 navigation reset

- **当** `resetForNavigation()` 清理已有 spatial objects
- **则** 必须应用同样的页面 generation 边界语义

### 需求：VisionOS 消费 SpatialDiv request epoch

VisionOS native SpatialDiv 创建处理在 `wsepoch` 存在时，必须从 `webspatial://createSpatialized2DElement` 请求中读取该字段。

#### 场景：Request epoch 匹配当前 generation

- **给定** SpatialDiv 创建请求携带的 `wsepoch` 等于当前 scene generation
- **当** VisionOS 处理 open-window 请求
- **则** 该请求可以创建并返回 `Spatialized2DElement` content host

#### 场景：Request epoch 已 stale

- **给定** 当前 scene generation 是 `G2`
- **并且** SpatialDiv 创建请求携带 `wsepoch=G1`
- **当** VisionOS 处理 open-window 请求
- **则** VisionOS 必须将该请求视为 stale
- **并且** 不得将该请求的 SpatialDiv 内容挂到当前 scene

#### 场景：兼容期内 request epoch 缺失

- **给定** SpatialDiv 创建请求未携带 `wsepoch`
- **当** VisionOS 在兼容期内处理 open-window 请求
- **则** VisionOS 应记录或暴露诊断 warning
- **并且** 可以出于向后兼容接受该请求

### 需求：VisionOS inspect 暴露刷新诊断信息

VisionOS `SpatialScene` inspect 输出必须暴露 page generation 和 object identity 字段，足以诊断刷新清理行为。

#### 场景：刷新后 inspect 当前 scene

- **当** 页面刷新后 inspect 当前 scene
- **则** 输出必须包含当前 page generation
- **并且** 必须包含足以识别残留 2D elements 的 spatial object identity 信息
